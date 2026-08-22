-- 1. Tables
CREATE TABLE public.circle_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (circle_id, shared_with_user_id)
);

CREATE TABLE public.circle_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  invited_email text,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.circle_shares TO authenticated;
GRANT ALL ON public.circle_shares TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.circle_invites TO authenticated;
GRANT ALL ON public.circle_invites TO service_role;

ALTER TABLE public.circle_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_invites ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER circle_invites_updated BEFORE UPDATE ON public.circle_invites
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Helper functions (security definer, bypass RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.can_access_circle(_circle uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.circles c WHERE c.id = _circle AND c.user_id = _user)
      OR EXISTS (SELECT 1 FROM public.circle_shares s WHERE s.circle_id = _circle AND s.shared_with_user_id = _user);
$$;

CREATE OR REPLACE FUNCTION public.can_access_friend(_friend uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.friends f WHERE f.id = _friend AND f.user_id = _user)
      OR EXISTS (
        SELECT 1 FROM public.circle_members m
        JOIN public.circle_shares s ON s.circle_id = m.circle_id
        WHERE m.friend_id = _friend AND s.shared_with_user_id = _user
      );
$$;

CREATE OR REPLACE FUNCTION public.shares_circle_with(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_shares s
    WHERE (s.owner_id = _a AND s.shared_with_user_id = _b)
       OR (s.owner_id = _b AND s.shared_with_user_id = _a)
  );
$$;

-- 3. Policies on the new tables
CREATE POLICY "owner manages shares" ON public.circle_shares FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "co-owner sees own share" ON public.circle_shares FOR SELECT TO authenticated
  USING (auth.uid() = shared_with_user_id);
CREATE POLICY "co-owner can leave" ON public.circle_shares FOR DELETE TO authenticated
  USING (auth.uid() = shared_with_user_id);

CREATE POLICY "owner manages invites" ON public.circle_invites FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- 4. Widen access for co-owners
CREATE POLICY "co-owner reads circle" ON public.circles FOR SELECT TO authenticated
  USING (public.can_access_circle(id, auth.uid()));
CREATE POLICY "co-owner edits circle" ON public.circles FOR UPDATE TO authenticated
  USING (public.can_access_circle(id, auth.uid())) WITH CHECK (public.can_access_circle(id, auth.uid()));

CREATE POLICY "co-owner reads members" ON public.circle_members FOR SELECT TO authenticated
  USING (public.can_access_circle(circle_id, auth.uid()));
CREATE POLICY "co-owner adds members" ON public.circle_members FOR INSERT TO authenticated
  WITH CHECK (public.can_access_circle(circle_id, auth.uid()) AND public.can_access_friend(friend_id, auth.uid()));
CREATE POLICY "co-owner removes members" ON public.circle_members FOR DELETE TO authenticated
  USING (public.can_access_circle(circle_id, auth.uid()));

CREATE POLICY "co-owner reads friends" ON public.friends FOR SELECT TO authenticated
  USING (public.can_access_friend(id, auth.uid()));
CREATE POLICY "co-owner edits friends" ON public.friends FOR UPDATE TO authenticated
  USING (public.can_access_friend(id, auth.uid())) WITH CHECK (public.can_access_friend(id, auth.uid()));

CREATE POLICY "co-owner reads interests" ON public.friend_interests FOR SELECT TO authenticated
  USING (public.can_access_friend(friend_id, auth.uid()));
CREATE POLICY "co-owner adds interests" ON public.friend_interests FOR INSERT TO authenticated
  WITH CHECK (public.can_access_friend(friend_id, auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "co-owner removes interests" ON public.friend_interests FOR DELETE TO authenticated
  USING (public.can_access_friend(friend_id, auth.uid()));

CREATE POLICY "co-owner reads notes" ON public.friend_notes FOR SELECT TO authenticated
  USING (public.can_access_friend(friend_id, auth.uid()));
CREATE POLICY "co-owner adds notes" ON public.friend_notes FOR INSERT TO authenticated
  WITH CHECK (public.can_access_friend(friend_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "co-owner reads gifts" ON public.gift_ideas FOR SELECT TO authenticated
  USING (public.can_access_friend(friend_id, auth.uid()));
CREATE POLICY "co-owner adds gifts" ON public.gift_ideas FOR INSERT TO authenticated
  WITH CHECK (public.can_access_friend(friend_id, auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "co-owner edits gifts" ON public.gift_ideas FOR UPDATE TO authenticated
  USING (public.can_access_friend(friend_id, auth.uid())) WITH CHECK (public.can_access_friend(friend_id, auth.uid()));

CREATE POLICY "shared users see profile" ON public.profiles FOR SELECT TO authenticated
  USING (public.shares_circle_with(id, auth.uid()));

-- 5. Accept an invite
CREATE OR REPLACE FUNCTION public.accept_circle_invite(_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv public.circle_invites%ROWTYPE; uid uuid := auth.uid();
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

  RETURN inv.circle_id;
END; $$;

REVOKE ALL ON FUNCTION public.accept_circle_invite(text) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_circle_invite(text) TO authenticated;

-- 6. Access list for the owner (names + emails of co-owners)
CREATE OR REPLACE FUNCTION public.circle_access_list(_circle uuid)
RETURNS TABLE (user_id uuid, display_name text, email text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.circles c WHERE c.id = _circle AND c.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only the circle owner can view access.';
  END IF;
  RETURN QUERY
    SELECT s.shared_with_user_id, p.display_name, u.email::text, s.created_at
    FROM public.circle_shares s
    LEFT JOIN public.profiles p ON p.id = s.shared_with_user_id
    LEFT JOIN auth.users u ON u.id = s.shared_with_user_id
    WHERE s.circle_id = _circle
    ORDER BY s.created_at;
END; $$;

REVOKE ALL ON FUNCTION public.circle_access_list(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.circle_access_list(uuid) TO authenticated;