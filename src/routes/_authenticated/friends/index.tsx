import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { circleMembersQuery, circlesQuery, friendsQuery, interestsQuery } from "@/lib/queries";
import { getBirthdayInfo, formatBirthdayLabel } from "@/lib/birthday";
import { circleColorClass } from "@/lib/types";
import { FriendAvatar } from "@/components/FriendAvatar";
import { FriendForm } from "@/components/FriendForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/friends/")({
  head: () => ({
    meta: [
      { title: "Friends — FriendCircles" },
      {
        name: "description",
        content:
          "Every friend you track, with their interests, favourites, circles and birthday in one list.",
      },
      { property: "og:title", content: "Friends — FriendCircles" },
      {
        property: "og:description",
        content: "Browse and search your friends, their interests and their circles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FriendsPage,
});

function FriendsPage() {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const friends = useQuery(friendsQuery());
  const circles = useQuery(circlesQuery());
  const members = useQuery(circleMembersQuery());
  const interests = useQuery(interestsQuery());

  const circleById = new Map((circles.data ?? []).map((circle) => [circle.id, circle]));
  const needle = query.trim().toLowerCase();

  const rows = (friends.data ?? []).map((friend) => {
    const friendCircles = (members.data ?? [])
      .filter((m) => m.friend_id === friend.id)
      .map((m) => circleById.get(m.circle_id))
      .filter(Boolean);
    const friendInterests = (interests.data ?? [])
      .filter((i) => i.friend_id === friend.id)
      .map((i) => i.interest);
    return { friend, friendCircles, friendInterests };
  });

  const filtered = needle
    ? rows.filter(({ friend, friendCircles, friendInterests }) =>
        [friend.name, friend.nickname ?? "", ...friendInterests, ...friendCircles.map((c) => c!.name)]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : rows;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Friends</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyone you're keeping track of.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="size-4" /> Add friend
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, interest or circle"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && (
        <Card className="paper">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {rows.length === 0
              ? "No friends yet. Add your first one to get started."
              : "No friends match that search."}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map(({ friend, friendCircles, friendInterests }) => {
          const info = getBirthdayInfo(friend.birthday, friend.birthday_has_year);
          const isMe = friend.linked_user_id != null && friend.linked_user_id === userId;
          return (
            <Link key={friend.id} to="/friends/$friendId" params={{ friendId: friend.id }}>
              <Card className="paper h-full transition-colors hover:border-primary/50">
                <CardContent className="flex gap-3 py-5">
                  <FriendAvatar name={friend.name} photoUrl={friend.photo_url} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-display font-semibold">
                      {friend.name}
                      {isMe && (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          You
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {info ? formatBirthdayLabel(info) : "No birthday saved"}
                      {friend.nickname ? ` · "${friend.nickname}"` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {friendCircles.map((circle) => (
                        <span
                          key={circle!.id}
                          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px]"
                        >
                          <span className={`size-2 rounded-full ${circleColorClass(circle!.color)}`} />
                          {circle!.name}
                        </span>
                      ))}
                      {friendInterests.slice(0, 3).map((interest) => (
                        <Badge key={interest} variant="outline" className="text-[11px] font-normal">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <FriendForm open={adding} onOpenChange={setAdding} />
    </div>
  );
}
