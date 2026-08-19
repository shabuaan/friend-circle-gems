import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, friendsQuery, wishesQuery } from "@/lib/queries";
import { getBirthdayInfo, countdownLabel, formatBirthdayLabel } from "@/lib/birthday";
import { FriendAvatar } from "@/components/FriendAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/birthdays")({
  head: () => ({
    meta: [
      { title: "Birthdays — FriendCircles" },
      {
        name: "description",
        content:
          "Every friend's birthday in order, with countdowns, overdue reminders and a way to mark who you've wished.",
      },
      { property: "og:title", content: "Birthdays — FriendCircles" },
      {
        property: "og:description",
        content: "Upcoming and overdue birthdays for everyone in your circles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BirthdaysPage,
});

function BirthdaysPage() {
  const queryClient = useQueryClient();
  const friends = useQuery(friendsQuery());
  const wishes = useQuery(wishesQuery());

  const markWished = useMutation({
    mutationFn: async ({ friendId, year }: { friendId: string; year: number }) => {
      const user_id = await currentUserId();
      const { error } = await supabase
        .from("birthday_wishes")
        .insert({ friend_id: friendId, year, user_id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["birthday_wishes"] });
      toast.success("Marked as wished");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const wished = new Set((wishes.data ?? []).map((w) => `${w.friend_id}:${w.year}`));

  const rows = (friends.data ?? [])
    .map((friend) => ({ friend, info: getBirthdayInfo(friend.birthday, friend.birthday_has_year) }))
    .filter((row) => row.info !== null) as {
    friend: NonNullable<typeof friends.data>[number];
    info: NonNullable<ReturnType<typeof getBirthdayInfo>>;
  }[];

  const overdue = rows
    .filter(
      ({ friend, info }) =>
        info.daysSincePrevious <= 30 && !wished.has(`${friend.id}:${info.previous.getFullYear()}`),
    )
    .sort((a, b) => a.info.daysSincePrevious - b.info.daysSincePrevious);

  const overdueIds = new Set(overdue.map((row) => row.friend.id));
  const upcoming = rows
    .filter((row) => !overdueIds.has(row.friend.id))
    .sort((a, b) => a.info.daysUntil - b.info.daysUntil);

  const missing = (friends.data ?? []).filter((friend) => !friend.birthday);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Birthdays</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sorted by what's next. Mark a birthday as wished once you've reached out.
        </p>
      </div>

      {overdue.length > 0 && (
        <Card className="paper border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Due & overdue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {overdue.map(({ friend, info }) => (
              <div key={friend.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                <FriendAvatar name={friend.name} photoUrl={friend.photo_url} className="size-9" />
                <div className="min-w-0">
                  <Link
                    to="/friends/$friendId"
                    params={{ friendId: friend.id }}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {friend.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {info.daysSincePrevious === 0
                      ? "Today"
                      : `${info.daysSincePrevious} day${info.daysSincePrevious === 1 ? "" : "s"} ago`}
                    {info.turnedAge ? ` · turned ${info.turnedAge}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() =>
                    markWished.mutate({ friendId: friend.id, year: info.previous.getFullYear() })
                  }
                >
                  <Check className="size-4" /> Wished
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="paper">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Coming up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {upcoming.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">
              No birthdays saved yet. Add a birthday on a friend's profile.
            </p>
          )}
          {upcoming.map(({ friend, info }) => (
            <Link
              key={friend.id}
              to="/friends/$friendId"
              params={{ friendId: friend.id }}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary"
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

      {missing.length > 0 && (
        <Card className="paper">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">No birthday saved</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {missing.map((friend) => (
              <Link key={friend.id} to="/friends/$friendId" params={{ friendId: friend.id }}>
                <Badge variant="outline" className="font-normal">
                  {friend.name}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
