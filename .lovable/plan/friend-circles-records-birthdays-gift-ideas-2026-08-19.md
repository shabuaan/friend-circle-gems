# Friend Circles — Records, Birthdays & Gift Ideas

A personal CRM for your friend groups: each signed-in user manages their own private friends, circles, profiles, birthdays and gift ideas.

## Core features

**Accounts**
- Email/password sign up and sign in. Each account's data is fully private.
- Public landing page at `/` with sign-in CTA; signed-in home is `/dashboard`.

**Friends**
- Add a friend with name, photo (optional), birthday, phone/email, notes, how you met.
- Profile fields: favorite color, favorite foods, hobbies/interests, favorite music/movies, clothing/shoe size, wishlist notes, dislikes/allergies.
- Interests stored as tags so they can be matched to gift ideas.
- Everything editable any time; each friend page shows an "updated" timestamp and a running notes timeline so you can track how they change over time.

**Circles**
- Create circles (school friends, work, gym...) with name, color and description.
- One friend can belong to many circles; add/remove membership from either side.
- Circle page lists members and that circle's upcoming birthdays.

**Birthdays**
- Dashboard shows: birthdays this week, next 30 days, and overdue/just-passed (with "mark as wished" so it clears).
- Age turning, days remaining, per-friend countdown.
- Full birthday calendar view grouped by month.
- In-app only — no emails.

**Gift ideas**
- Rule-based matches: each interest tag maps to a built-in catalog of gift categories with concrete suggestions, filtered by a budget selector.
- AI "Generate gift ideas" button on a friend's page: uses their full profile (interests, favorites, dislikes, budget, occasion) to produce 5 tailored suggestions with a reason for each.
- Save any idea to that friend's gift list; mark as bought/gifted with date, so you don't repeat gifts.
- Gift history per friend visible on their profile.

## Screens

1. `/` — landing + sign in CTA
2. `/auth` — sign up / sign in
3. `/dashboard` — upcoming & overdue birthdays, quick stats, recent friends
4. `/circles`, `/circles/$id` — circle list and detail
5. `/friends`, `/friends/$id` — friend list (search/filter by circle, interest) and full profile with edit, gift ideas, gift history
6. `/birthdays` — calendar by month

## Technical notes

- Lovable Cloud (database + auth) provides storage; all tables have row-level security scoped to the owning user.
- Tables: `profiles`, `circles`, `friends`, `circle_members` (many-to-many), `friend_interests`, `gift_ideas`, `friend_notes`, `birthday_wishes`.
- Friend photos stored in a private storage bucket.
- Gift AI runs server-side through the Lovable AI Gateway (google/gemini-2.5-flash) with structured output; the rule-based catalog is local data so ideas always appear even without AI.
- Birthday math done in code from the stored date (handles Feb 29, no-year birthdays optional).
- TanStack Start routes with protected `_authenticated` subtree; data via TanStack Query.

## Design

Warm, personal scrapbook feel — soft cream/ink palette with per-circle accent colors, rounded cards, friendly display typeface for headings. Not a corporate CRM look.
