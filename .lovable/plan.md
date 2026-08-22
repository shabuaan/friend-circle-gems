# Share a circle with co-owners

Let you hand out access to one specific circle — by single-use invite link or by email invite — and manage or revoke that access at any time.

## What you get

**Share a circle**
- Each circle detail/card gets a "Share" action opening a Share dialog.
- Generate an invite: creates a single-use link (`/join/<token>`). Copy it, send it however you like.
- Or invite by email: enter an address, we send a real invite email containing that person's own single-use link.
- Each invite shows status: pending, accepted, revoked, expired (links expire after 14 days).

**Accepting**
- Opening a join link while signed out sends you to sign in/sign up first, then straight back to the invite.
- On accept, the token is consumed (single-use) and you become a co-owner of that circle.
- If an email invite was sent to a different address than the account used, we still accept it (link is the proof) but show who accepted.

**Managing access**
- A "People with access" list on the Share dialog: owner + each co-owner, plus pending invites.
- Remove a co-owner — they lose access immediately.
- Revoke a pending invite — the link stops working right away.
- Co-owners see a shared circle in their own Circles list, badged "Shared by <name>", and can leave it themselves.

**What a co-owner can do (full co-owner)**
- View and edit the circle (name, colour, description), add/remove friends in it.
- View and edit the profiles, interests, notes and gift ideas of friends who are in that circle.
- They cannot delete the circle or manage its sharing — that stays with the original owner.
- Friends not in a shared circle stay completely private.

## Technical notes

**Data**
- `circle_shares`: circle_id, owner_id, shared_with_user_id, created_at — one row per active co-owner.
- `circle_invites`: circle_id, owner_id, token (random, hashed lookup by token), invited_email (nullable), status (pending/accepted/revoked), expires_at, accepted_by, accepted_at.

**Access rules** — current policies are all `auth.uid() = user_id`, so they widen via two security-definer helpers:
- `can_access_circle(_circle uuid, _user uuid)` → owner OR row in `circle_shares`.
- `can_access_friend(_friend uuid, _user uuid)` → owner OR friend is in `circle_members` of a circle the user can access.
- Add co-owner SELECT/UPDATE policies using these to `circles`, `circle_members`, `friends`, `friend_interests`, `friend_notes`, `gift_ideas`, `birthday_wishes`. Owner-only for circle DELETE and all of `circle_shares` / `circle_invites` management. GRANTs on the two new tables.
- Existing queries in `src/lib/queries.ts` need no filter changes — RLS returns the extra rows; UI distinguishes owned vs shared by comparing `user_id`.

**Server functions** (`src/lib/sharing.functions.ts`, `requireSupabaseAuth`):
- `createInvite` (returns raw token once), `revokeInvite`, `listCircleAccess`, `removeCoOwner`, `leaveCircle`, `acceptInvite` (validates token, status, expiry; inserts `circle_shares`; marks accepted — done with an admin/security-definer path since the invitee can't read the invite row).
- `/join/$token` public route → signed-out shows sign-in CTA with return path; signed-in calls `acceptInvite` then navigates to the circle.

**Email**
- Invite emails send from your own verified sending domain. Nothing is configured yet, so the first step is the email domain setup dialog; until DNS verifies, invites still work by copying the link. Sending happens in the server function via the project's email integration.

**UI files**: new `src/components/ShareCircleDialog.tsx`, new `src/routes/join.$token.tsx`, updates to `src/routes/_authenticated/circles.tsx` (share button, shared badge, hide delete for shared circles).
