import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/join/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Join a circle — FriendCircles" },
      {
        name: "description",
        content: "Accept an invite to co-own a friend circle and help keep it up to date.",
      },
      { property: "og:title", content: "Join a circle — FriendCircles" },
      {
        property: "og:description",
        content: "Someone shared a friend circle with you. Sign in to accept the invite.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { token } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "working">("idle");

  useEffect(() => {
    if (loading || !user || status === "working" || error) return;
    setStatus("working");
    supabase
      .rpc("accept_circle_invite", { _token: token })
      .then(({ error: rpcError }) => {
        if (rpcError) {
          setError(rpcError.message.replace(/^.*?:\s*/, ""));
          setStatus("idle");
          return;
        }
        navigate({ to: "/circles" });
      });
  }, [loading, user, token, status, error, navigate]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="paper w-full">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Circle invite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {loading && <p>Checking your invite…</p>}
          {!loading && !user && (
            <>
              <p>Sign in or create an account to accept this invite.</p>
              <Button asChild className="w-full">
                <Link to="/auth" search={{ redirect: `/join/${token}` }}>
                  Sign in to continue
                </Link>
              </Button>
            </>
          )}
          {!loading && user && !error && <p>Accepting your invite…</p>}
          {error && (
            <>
              <p className="text-destructive">{error}</p>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/circles">Go to my circles</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
