import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CakeSlice, Plus, Users, CircleDashed } from "lucide-react";
import { useState } from "react";
import { circlesQuery, friendsQuery, wishesQuery } from "@/lib/queries";
import { getBirthdayInfo, countdownLabel, formatBirthdayLabel } from "@/lib/birthday";
import { FriendAvatar } from "@/components/FriendAvatar";
import { FriendForm } from "@/components/FriendForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your circle at a glance — FriendCircles" },
      {
        name: "description",
        content:
          "See upcoming and overdue birthdays, your friend circles, and jump straight into gift ideas.",
      },
      { property: "og:title", content: "Your circle at a glance — FriendCircles" },
      {
        property: "og:description",
        content: "Upcoming birthdays, circles and gift ideas for the people you care about.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [adding, setAdding] = useState(false);
  const friends = useQuery(friendsQuery());
  const circles = useQuery(circlesQuery());
  const wishes = useQuery(wishesQuery());

  const wished = new Set((wishes.data ?? []).map((w) => `${w.friend_id}:${w.year}`));

  const withBirthdays = (friends.data ?? [])
    .map((friend) => ({ friend, info: getBirthdayInfo(friend.birthday, friend.birthday_has_year) }))
    .filter((row): row is { friend: (typeof row)["friend"]; info: NonNullable<typeof row.info> } =>
      Boolean(row.info),
    );

  const overdue = withBirthdays
    .filter(
      ({ friend, info }) =>
        info.daysSincePrevious <= 14 &&
        !wished.has(`${friend.id}:${info.previous.getFullYear()}`),
    )
    .sort((a, b) => a.info.daysSincePrevious - b.info.daysSincePrevious);

  const upcoming = withBirthdays
    .filter(({ info }) => info.daysUntil <= 60)
    .sort((a, b) => a.info.daysUntil - b.info.daysUntil)
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Your circle</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {friends.data?.length ?? 0} friends across {circles.data?.length ?? 0} circles.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="size-4" /> Add friend
        </Button>
      </div>

      {overdue.length > 0 && (
        <Card className="paper border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <CakeSlice className="size-4 text-destructive" /> Needs a message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdue.map(({ friend, info }) => (
              <Link
                key={friend.id}
                to="/friends/$friendId"
                params={{ friendId: friend.id }}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary"
              >
                <FriendAvatar name={friend.name} photoUrl={friend.photo_url} className="size-9" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{friend.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {info.daysSincePrevious === 0
                      ? "Birthday is today"
                      : `Birthday was ${info.daysSincePrevious} day${info.daysSincePrevious === 1 ? "" : "s"} ago`}
                  </p>
                </div>
                <Badge variant="destructive" className="ml-auto">
                  Overdue
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="paper">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <CakeSlice className="size-4 text-primary" /> Next 60 days
          </CardTitle>
          <Link to="/birthdays" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            See all
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">
              No birthdays coming up in the next two months.
            </p>
          )}
          {upcoming.map(({ friend, info }) => (
            <Link
              key={friend.id}
              to="/friends/$friendId"
              params={{ friendId: friend.id }}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary"
            >
              <FriendAvatar name={friend.name} photoUrl={friend.photo_url} className="size-9" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{friend.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBirthdayLabel(info)}
                  {info.turningAge ? ` · turning ${info.turningAge}` : ""}
                </p>
              </div>
              <span className="ml-auto text-xs font-medium text-primary">
                {countdownLabel(info)}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/friends" className="group">
          <Card className="paper h-full transition-colors group-hover:border-primary/50">
            <CardContent className="flex items-center gap-3 py-6">
              <Users className="size-5 text-primary" />
              <div>
                <p className="font-display font-semibold">Friends</p>
                <p className="text-xs text-muted-foreground">
                  Profiles, interests and gift ideas
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/circles" className="group">
          <Card className="paper h-full transition-colors group-hover:border-primary/50">
            <CardContent className="flex items-center gap-3 py-6">
              <CircleDashed className="size-5 text-primary" />
              <div>
                <p className="font-display font-semibold">Circles</p>
                <p className="text-xs text-muted-foreground">Group friends however you like</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <FriendForm open={adding} onOpenChange={setAdding} />
    </div>
  );
}
