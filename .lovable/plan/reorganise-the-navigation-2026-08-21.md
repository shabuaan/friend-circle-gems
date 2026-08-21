# Reorganise the navigation

## Current problem
The authenticated app shell (`AppShell.tsx`) squeezes four route links, a theme picker and a sign-out button into a single sticky top header. On small screens the links collapse to icon-only and the row still feels crowded; the brand and actions fight for the same horizontal space.

## Goal
Move primary way-finding out of the header so the top bar is clean, while keeping every route one tap away on both mobile and desktop.

## Proposed changes

### 1. Mobile: bottom tab bar
- Add a fixed bottom navigation bar that appears only below the `md` breakpoint.
- Show the four core routes as labelled tabs with icons: Home, Friends, Circles, Birthdays.
- Highlight the active route with the current accent/primary colour.
- Keep the tab bar above the safe-area inset so it never overlaps system gestures.

### 2. Desktop: left sidebar
- Replace the header nav row with a collapsible left sidebar at `md` and above.
- Sidebar width uses the explicit `var(--sidebar-width)` syntax to avoid the known Tailwind v4 / shadcn sidebar overlap bug.
- The sidebar contains the same four route links plus the theme picker and sign-out action grouped at the bottom.
- Collapse to icon-only on smaller desktop widths or via a toggle.

### 3. Top header: minimal brand bar
- Keep only the logo/title and a small user menu (theme + sign out) in the sticky top header.
- On mobile the header becomes a simple brand strip; on desktop it sits above the sidebar and shows the current page title.

### 4. Layout spacing
- Update the main content wrapper so it is not covered by the bottom bar on mobile (`pb-20`) and respects the sidebar width on desktop (`md:pl-[var(--sidebar-width)]`).
- Ensure the single `<main>` rule is preserved and `AppShell` still wraps `Outlet`.

## Technical notes
- Reuse the existing `NAV` array and icons so no route logic changes.
- Use `useRouterState` from `@tanstack/react-router` for active-route highlighting.
- Keep the existing `ThemePicker` dropdown; move it into the sidebar footer on desktop and into the top user menu on mobile.
- No backend or auth changes required; this is a pure shell/layout refactor.

## Files to change
- `src/components/AppShell.tsx` — restructure header, add bottom bar and sidebar.
- `src/styles.css` — add sidebar-width CSS variables if not already present; ensure safe-area utilities are available.
- Optionally create `src/components/AppSidebar.tsx` if the sidebar grows beyond a single file.

## Acceptance criteria
- Header no longer shows four nav links + theme + sign-out in one row.
- Mobile users see a bottom tab bar with icon + label for each route.
- Desktop users see a left sidebar with the same routes, theme picker and sign-out.
- Active route is visually highlighted on both form factors.
- No route URLs or auth behaviour changes.
