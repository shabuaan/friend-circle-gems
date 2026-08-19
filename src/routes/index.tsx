import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CakeSlice, CircleDashed, Gift, NotebookPen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FriendCircles — remember the people you love" },
      {
        name: "description",
        content:
          "Keep private records of your friend circles: profiles, interests, favourites, birthday reminders and gift ideas that actually fit.",
      },
      { property: "og:title", content: "FriendCircles — remember the people you love" },
      {
        property: "og:description",
        content:
          "Friend profiles, overlapping circles, birthday reminders and thoughtful gift ideas in one private place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: NotebookPen,
    title: "Profiles that grow",
    body: "Favourite colour, foods, music, sizes, dislikes — update them as you learn more.",
  },
  {
    icon: CircleDashed,
    title: "Overlapping circles",
    body: "School, work, family, gaming. One friend can live in as many circles as you like.",
  },
  {
    icon: CakeSlice,
    title: "Birthdays, handled",
    body: "Countdowns for what's coming, nudges for the ones you haven't wished yet.",
  },
  {
    icon: Gift,
    title: "Gift ideas that fit",
    body: "Matched from their profile, plus AI suggestions tuned to your budget.",
  },
];

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="font-display text-lg font-semibold tracking-tight">
          Friend<span className="text-primary">Circles</span>
        </span>
        <Link to="/auth">
          <Button variant="outline" size="sm">
            Sign in
          </Button>
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="py-16 sm:py-24">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            A quiet little archive
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Remember the people you love, properly.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground">
            Keep every friend circle, every favourite colour and every birthday in one private
            place — and never scramble for a gift idea again.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth">
              <Button size="lg">Start your circle</Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="paper rounded-xl border border-border p-6">
              <Icon className="size-5 text-primary" aria-hidden />
              <h2 className="mt-3 font-display text-lg font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Your records stay private to your account.
      </footer>
    </div>
  );
}
