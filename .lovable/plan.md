# Your own profile, joined members in circles, and a form reset fix

## 1. You as a friend card

- On first sign-in, a friend card for you is created automatically from your account name and email, marked as "You".
- It behaves like any other friend card: editable, can hold favourites, interests, birthday, and can be added to any circle from your friend list or the circle page.
- It shows a "You" badge in lists so it never looks like a duplicate contact.

## 2. When someone joins a shared circle

- Accepting an invite now also adds the joiner's own friend card into that circle, so the owner immediately sees them as a member.
- Members who never sign in keep working exactly as today: plain friend cards owned by you, no account needed.
- If the joiner's card is later edited by them, the owner sees the updates (co-owner access already covers this).

## 3. Duplicate detection and merge

- After a join, if you already have a friend card that looks like the same person (same email, or a close name match), the circle card and the friend profile show a "Possible duplicate" prompt.
- The prompt offers:
  - **Merge** — keep one card, fill any empty fields from the other, move interests, notes, gift ideas and circle memberships over, delete the leftover, and link the surviving card to the joined account.
  - **Keep both** — dismisses the prompt permanently for that pair.
- Merge is only offered to the person who owns the duplicate card.

## 4. Add-friend form remembering the last entry

The Add friend dialog keeps whatever you typed last time until the page is refreshed. It will be reset every time the dialog is opened fresh, so "Add friend" always starts blank (editing an existing friend still preloads their details).

## Technical notes

- Migration: add `friends.linked_user_id uuid` (nullable, unique per owner) plus `friends.is_self boolean default false`; add a `duplicate_dismissals` table (owner_id, friend_a, friend_b) for "keep both". Grants + RLS scoped to `auth.uid()` on the new table; extend existing friend policies to allow a linked user to edit their own card.
- Self card creation: extend `handle_new_user()` to also insert a self friend row (name from display name/email, `is_self = true`, `linked_user_id = new.id`), and a one-time client-side backfill for existing accounts on `_authenticated` load.
- `accept_circle_invite`: after granting the share, insert the joiner's self friend row into `circle_members` for that circle (ON CONFLICT DO NOTHING).
- Duplicate detection: a `find_circle_duplicates(_circle uuid)` SQL function comparing lower(email) equality or normalized-name equality among a circle's friends, excluding dismissed pairs.
- Merge: a `merge_friends(_keep uuid, _drop uuid)` security-definer function that coalesces empty columns, repoints `friend_interests`, `friend_notes`, `gift_ideas`, `birthday_wishes`, `circle_members`, then deletes the dropped row; only callable by the owner of both rows.
- UI: "You" badge in `friends/index.tsx` and circle member lists; duplicate banner with Merge / Keep both on the circle card and friend profile.
- Form fix: in `FriendForm.tsx` the reset guard only fires when `friend?.id` changes; key the reset on the open transition instead so opening the dialog always reinitialises `values`.
