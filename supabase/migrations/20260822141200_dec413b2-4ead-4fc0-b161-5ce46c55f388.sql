-- 1. Self / linked-account columns on friends
ALTER TABLE public.friends
  ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_self boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS friends_self_unique
  ON public.friends (user_id) WHERE is_self;

CREATE POLICY "linked user reads own card" ON public.friends
  FOR SELECT TO authenticated USING (auth.uid() = linked_user_id);
CREATE POLICY "linked user edits own card" ON public.friends
  FOR UPDATE TO authenticated USING (auth.uid() = linked_user_id) WITH CHECK (auth.uid() = linked_user_id);

-- 2. Dismissed duplicate pairs
CREATE TABLE IF NOT EXISTS public.duplicate_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_a uuid NOT NULL REFERENCES public.friends(id) ON DELETE CASCADE,
  friend_b uuid NOT NULL REFERENCES public.friends(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_a, friend_b)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.duplicate_dismissals TO authenticated;
GRANT ALL ON public.duplicate_dismissals TO service_role;

ALTER TABLE public.duplicate_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own dismissals" ON public.duplicate_dismissals
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Self friend card on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _name text;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, _name)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.friends (user_id, name, email, is_self, linked_user_id)
  VALUES (NEW.id, _name, NEW.email, true, NEW.id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $function$;

-- Backfill self cards for existing accounts
INSERT INTO public.friends (user_id, name, email, is_self, linked_user_id)
SELECT u.id,
       COALESCE(p.display_name, split_part(u.email, '@', 1)),
       u.email,
       true,
       u.id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE NOT EXISTS (SELECT 1 FROM public.friends f WHERE f.user_id = u.id AND f.is_self);

-- 4. Joining a circle adds your own card as a member
CREATE OR REPLACE FUNCTION public.accept_circle_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE inv public.circle_invites%ROWTYPE; uid uuid := auth.uid(); self_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'You must be signed in to accept an invite.'; END IF;
  SELECT * INTO inv FROM public.circle_invites WHERE token = _token;
  IF inv.id IS NULL THEN RAISE EXCEPTION 'This invite link is not valid.'; END IF;
  IF inv.owner_id = uid THEN RAISE EXCEPTION 'This is your own circle.'; END IF;
  IF inv.status <> 'pending' THEN RAISE EXCEPTION 'This invite link has already been used or revoked.'; END IF;
  IF inv.expires_at < now() THEN RAISE EXCEPTION 'This invite link has expired.'; END IF;

  INSERT INTO public.circle_shares (circle_id, owner_id, shared_with_user_id)
  VALUES (inv.circle_id, inv.owner_id, uid)
  ON CONFLICT (circle_id, shared_with_user_id) DO NOTHING;

  UPDATE public.circle_invites
     SET status = 'accepted', accepted_by = uid, accepted_at = now()
   WHERE id = inv.id;

  SELECT id INTO self_id FROM public.friends WHERE user_id = uid AND is_self LIMIT 1;
  IF self_id IS NOT NULL THEN
    INSERT INTO public.circle_members (user_id, circle_id, friend_id)
    SELECT uid, inv.circle_id, self_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.circle_members m
      WHERE m.circle_id = inv.circle_id AND m.friend_id = self_id
    );
  END IF;

  RETURN inv.circle_id;
END; $function$;

-- 5. Duplicate suggestions within a circle
CREATE OR REPLACE FUNCTION public.find_circle_duplicates(_circle uuid)
RETURNS TABLE(mine_id uuid, mine_name text, other_id uuid, other_name text, other_is_self boolean, reason text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.can_access_circle(_circle, uid) THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT a.id, a.name, b.id, b.name, b.is_self,
         CASE WHEN a.email IS NOT NULL AND lower(a.email) = lower(b.email) THEN 'email' ELSE 'name' END
  FROM public.circle_members ma
  JOIN public.friends a ON a.id = ma.friend_id
  JOIN public.circle_members mb ON mb.circle_id = ma.circle_id AND mb.friend_id <> ma.friend_id
  JOIN public.friends b ON b.id = mb.friend_id
  WHERE ma.circle_id = _circle
    AND a.user_id = uid
    AND a.is_self = false
    AND b.user_id <> uid
    AND (
      (a.email IS NOT NULL AND b.email IS NOT NULL AND lower(a.email) = lower(b.email))
      OR lower(regexp_replace(a.name, '\s+', ' ', 'g')) = lower(regexp_replace(b.name, '\s+', ' ', 'g'))
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.duplicate_dismissals d
      WHERE d.user_id = uid
        AND ((d.friend_a = a.id AND d.friend_b = b.id) OR (d.friend_a = b.id AND d.friend_b = a.id))
    );
END; $function$;

-- 6. Merge my duplicate card into the joined person's card
CREATE OR REPLACE FUNCTION public.merge_friends(_keep uuid, _drop uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'You must be signed in.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.friends WHERE id = _drop AND user_id = uid) THEN
    RAISE EXCEPTION 'You can only merge a friend card you created.';
  END IF;
  IF NOT public.can_access_friend(_keep, uid) THEN
    RAISE EXCEPTION 'You do not have access to that profile.';
  END IF;
  IF _keep = _drop THEN RAISE EXCEPTION 'Nothing to merge.'; END IF;

  UPDATE public.friends k SET
    nickname = COALESCE(k.nickname, d.nickname),
    photo_url = COALESCE(k.photo_url, d.photo_url),
    birthday = COALESCE(k.birthday, d.birthday),
    email = COALESCE(k.email, d.email),
    phone = COALESCE(k.phone, d.phone),
    how_we_met = COALESCE(k.how_we_met, d.how_we_met),
    favorite_color = COALESCE(k.favorite_color, d.favorite_color),
    favorite_foods = COALESCE(k.favorite_foods, d.favorite_foods),
    favorite_media = COALESCE(k.favorite_media, d.favorite_media),
    clothing_size = COALESCE(k.clothing_size, d.clothing_size),
    shoe_size = COALESCE(k.shoe_size, d.shoe_size),
    wishlist = COALESCE(k.wishlist, d.wishlist),
    dislikes = COALESCE(k.dislikes, d.dislikes),
    notes = COALESCE(k.notes, d.notes)
  FROM public.friends d
  WHERE k.id = _keep AND d.id = _drop;

  UPDATE public.friend_interests SET friend_id = _keep WHERE friend_id = _drop
    AND NOT EXISTS (SELECT 1 FROM public.friend_interests x WHERE x.friend_id = _keep AND lower(x.interest) = lower(friend_interests.interest));
  DELETE FROM public.friend_interests WHERE friend_id = _drop;
  UPDATE public.friend_notes SET friend_id = _keep WHERE friend_id = _drop;
  UPDATE public.gift_ideas SET friend_id = _keep WHERE friend_id = _drop;
  DELETE FROM public.birthday_wishes WHERE friend_id = _drop;
  UPDATE public.circle_members SET friend_id = _keep WHERE friend_id = _drop
    AND NOT EXISTS (SELECT 1 FROM public.circle_members x WHERE x.friend_id = _keep AND x.circle_id = circle_members.circle_id);
  DELETE FROM public.circle_members WHERE friend_id = _drop;
  DELETE FROM public.duplicate_dismissals WHERE friend_a = _drop OR friend_b = _drop;
  DELETE FROM public.friends WHERE id = _drop AND user_id = uid;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.find_circle_duplicates(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.merge_friends(uuid, uuid) FROM anon;