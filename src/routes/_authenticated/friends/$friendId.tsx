import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CakeSlice, Check, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  circleMembersQuery,
  circlesQuery,
  currentUserId,
  friendNotesQuery,
  friendQuery,
  giftIdeasQuery,
  interestsQuery,
  wishesQuery,
} from "@/lib/queries";
import { getBirthdayInfo, countdownLabel, formatBirthdayLabel } from "@/lib/birthday";
import { circleColorClass } from "@/lib/types";
import { suggestGifts, BUDGET_LABELS, type Budget } from "@/lib/gift-catalog";
import { generateGiftIdeas, type AiGiftIdea } from "@/lib/gifts.functions";
import { FriendAvatar } from "@/components/FriendAvatar";
import { FriendForm } from "@/components/FriendForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/friends/$friendId")({
  head: () => ({
    meta: [
      { title: "Friend profile — FriendCircles" },
      {
        name: "description",
        content:
          "A friend's full profile: interests, favourites, circles, birthday countdown, gift ideas and notes.",
      },
      { property: "og:title", content: "Friend profile — FriendCircles" },
      {
        property: "og:description",
        content: "Interests, favourites, birthdays and gift ideas for one friend.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FriendDetailPage,
  errorComponent: ({ error }) => (
    <p role="alert" className="py-12 text-center text-sm text-destructive">
      {error.message}
    </p>
  ),
  notFoundComponent: () => (
    <p className="py-12 text-center text-sm text-muted-foreground">Friend not found.</p>
  ),
});

function FriendDetailPage() {
  const { friendId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [budget, setBudget] = useState<Budget | "any">("any");
  const [aiIdeas, setAiIdeas] = useState<AiGiftIdea[]>([]);
  const callAi = useServerFn(generateGiftIdeas);

  const friendResult = useQuery(friendQuery(friendId));
  const interests = useQuery(interestsQuery());
  const circles = useQuery(circlesQuery());
  const members = useQuery(circleMembersQuery());
  const gifts = useQuery(giftIdeasQuery(friendId));
  const notes = useQuery(friendNotesQuery(friendId));
  const wishes = useQuery(wishesQuery());

  const friend = friendResult.data;
  const friendInterests = (interests.data ?? []).filter((i) => i.friend_id === friendId);
  const memberships = (members.data ?? []).filter((m) => m.friend_id === friendId);
  const memberCircleIds = new Set(memberships.map((m) => m.circle_id));

  const invalidate = (keys: string[][]) =>
    keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));

  const addInterest = useMutation({
    mutationFn: async (interest: string) => {
      const user_id = await currentUserId();
      const { error } = await supabase
        .from("friend_interests")
        .insert({ friend_id: friendId, interest: interest.trim(), user_id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setNewInterest("");
      invalidate([["friend_interests"]]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeInterest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("friend_interests").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate([["friend_interests"]]),
  });

  const toggleCircle = useMutation({
    mutationFn: async (circleId: string) => {
      if (memberCircleIds.has(circleId)) {
        const { error } = await supabase
          .from("circle_members")
          .delete()
          .eq("friend_id", friendId)
          .eq("circle_id", circleId);
        if (error) throw new Error(error.message);
        return;
      }
      const user_id = await currentUserId();
      const { error } = await supabase
        .from("circle_members")
        .insert({ friend_id: friendId, circle_id: circleId, user_id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate([["circle_members"]]),
    onError: (error: Error) => toast.error(error.message),
  });

  const saveGift = useMutation({
    mutationFn: async (gift: { title: string; reason: string | null; source: string }) => {
      const user_id = await currentUserId();
      const { error } = await supabase.from("gift_ideas").insert({
        friend_id: friendId,
        user_id,
        title: gift.title,
        reason: gift.reason,
        source: gift.source,
        price_range: budget === "any" ? null : BUDGET_LABELS[budget],
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Saved to gift list");
      invalidate([["gift_ideas", friendId]]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateGift = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("gift_ideas")
        .update({
          status,
          gifted_on: status === "gifted" ? new Date().toISOString().slice(0, 10) : null,
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate([["gift_ideas", friendId]]),
  });

  const deleteGift = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gift_ideas").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate([["gift_ideas", friendId]]),
  });

  const addNote = useMutation({
    mutationFn: async (body: string) => {
      const user_id = await currentUserId();
      const { error } = await supabase
        .from("friend_notes")
        .insert({ friend_id: friendId, body: body.trim(), user_id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setNoteBody("");
      invalidate([["friend_notes", friendId]]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const markWished = useMutation({
    mutationFn: async (year: number) => {
      const user_id = await currentUserId();
      const { error } = await supabase
        .from("birthday_wishes")
        .insert({ friend_id: friendId, year, user_id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Marked as wished");
      invalidate([["birthday_wishes"]]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteFriend = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("friends").delete().eq("id", friendId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      navigate({ to: "/friends" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const aiMutation = useMutation({
    mutationFn: async () => {
      if (!friend) throw new Error("Friend not loaded");
      const info = getBirthdayInfo(friend.birthday, friend.birthday_has_year);
      return callAi({
        data: {
          name: friend.name,
          interests: friendInterests.map((i) => i.interest),
          favoriteColor: friend.favorite_color,
          favoriteFoods: friend.favorite_foods,
          favoriteMedia: friend.favorite_media,
          wishlist: friend.wishlist,
          dislikes: friend.dislikes,
          budget: budget === "any" ? "no strict budget" : BUDGET_LABELS[budget],
          occasion: info?.turningAge ? `birthday, turning ${info.turningAge}` : "birthday",
          notes: friend.notes,
        },
      });
    },
    onSuccess: (result) => {
      if (result.error) toast.error(result.error);
      setAiIdeas(result.ideas);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (friendResult.isLoading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>;
  }
  if (!friend) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Friend not found.</p>;
  }

  const info = getBirthdayInfo(friend.birthday, friend.birthday_has_year);
  const previousYear = info?.previous.getFullYear();
  const alreadyWished =
    previousYear !== undefined &&
    (wishes.data ?? []).some((w) => w.friend_id === friendId && w.year === previousYear);

  const catalogIdeas = suggestGifts(
    friendInterests.map((i) => i.interest),
    [friend.favorite_foods, friend.favorite_media, friend.wishlist, friend.notes],
    budget === "any" ? undefined : budget,
  );

  const facts: [string, string | null][] = [
    ["Nickname", friend.nickname],
    ["Favourite colour", friend.favorite_color],
    ["Favourite foods", friend.favorite_foods],
    ["Music, films, books", friend.favorite_media],
    ["Wishlist", friend.wishlist],
    ["Dislikes & allergies", friend.dislikes],
    ["Clothing size", friend.clothing_size],
    ["Shoe size", friend.shoe_size],
    ["How we met", friend.how_we_met],
    ["Email", friend.email],
    ["Phone", friend.phone],
    ["Notes", friend.notes],
  ];

  return (
    <div className="space-y-6">
      <Link
        to="/friends"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All friends
      </Link>

      <div className="flex flex-wrap items-start gap-4">
        <FriendAvatar name={friend.name} photoUrl={friend.photo_url} className="size-16 text-lg" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{friend.name}</h1>
          {info && (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <CakeSlice className="size-4 text-primary" />
              {formatBirthdayLabel(info)}
              {info.turningAge ? ` · turning ${info.turningAge}` : ""}
              <span className="text-primary">· {countdownLabel(info)}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-4" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete friend"
            onClick={() => {
              if (confirm(`Remove ${friend.name} and all their records?`)) deleteFriend.mutate();
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {info && info.daysSincePrevious <= 30 && !alreadyWished && previousYear !== undefined && (
        <Card className="paper border-primary/40">
          <CardContent className="flex flex-wrap items-center gap-3 py-4">
            <p className="text-sm">
              {info.daysSincePrevious === 0
                ? `It's ${friend.name}'s birthday today.`
                : `${friend.name}'s birthday was ${info.daysSincePrevious} days ago.`}
            </p>
            <Button size="sm" className="ml-auto" onClick={() => markWished.mutate(previousYear)}>
              <Check className="size-4" /> Mark as wished
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="gifts">Gifts</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 pt-4">
          <Card className="paper">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Interests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {friendInterests.length === 0 && (
                  <p className="text-sm text-muted-foreground">No interests recorded yet.</p>
                )}
                {friendInterests.map((interest) => (
                  <span
                    key={interest.id}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm"
                  >
                    {interest.interest}
                    <button
                      type="button"
                      aria-label={`Remove ${interest.interest}`}
                      onClick={() => removeInterest.mutate(interest.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (newInterest.trim()) addInterest.mutate(newInterest);
                }}
              >
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="e.g. coffee, hiking, anime"
                />
                <Button type="submit" variant="outline">
                  <Plus className="size-4" /> Add
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="paper">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Circles</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(circles.data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No circles yet — create one on the Circles page.
                </p>
              )}
              {(circles.data ?? []).map((circle) => {
                const active = memberCircleIds.has(circle.id);
                return (
                  <button
                    key={circle.id}
                    type="button"
                    onClick={() => toggleCircle.mutate(circle.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className={`size-2 rounded-full ${circleColorClass(circle.color)}`} />
                    {circle.name}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="paper">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {facts
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="text-sm">{value}</dd>
                    </div>
                  ))}
              </dl>
              {facts.every(([, value]) => !value) && (
                <p className="text-sm text-muted-foreground">
                  Nothing saved yet — hit Edit to fill in their favourites.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gifts" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Budget</span>
            <Select value={budget} onValueChange={(value) => setBudget(value as Budget | "any")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any budget</SelectItem>
                <SelectItem value="under-25">{BUDGET_LABELS["under-25"]}</SelectItem>
                <SelectItem value="25-75">{BUDGET_LABELS["25-75"]}</SelectItem>
                <SelectItem value="75-plus">{BUDGET_LABELS["75-plus"]}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="ml-auto"
              onClick={() => aiMutation.mutate()}
              disabled={aiMutation.isPending}
            >
              <Sparkles className="size-4" />
              {aiMutation.isPending ? "Thinking…" : "AI ideas"}
            </Button>
          </div>

          {aiIdeas.length > 0 && (
            <Card className="paper border-primary/40">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">AI suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiIdeas.map((idea) => (
                  <div key={idea.title} className="flex items-start gap-3 rounded-lg bg-secondary/60 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{idea.title}</p>
                      <p className="text-xs text-muted-foreground">{idea.reason}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() =>
                        saveGift.mutate({ title: idea.title, reason: idea.reason, source: "ai" })
                      }
                    >
                      Save
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="paper">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Matched to their profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {catalogIdeas.map((idea) => (
                <div key={idea.title} className="flex items-start gap-3 rounded-lg p-2 hover:bg-secondary/60">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{idea.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {idea.reason}
                      {idea.matchedOn ? ` · matched "${idea.matchedOn}"` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto shrink-0 text-[11px] font-normal">
                    {BUDGET_LABELS[idea.budget]}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      saveGift.mutate({ title: idea.title, reason: idea.reason, source: "catalog" })
                    }
                  >
                    Save
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="paper">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Saved gift list</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(gifts.data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
              )}
              {(gifts.data ?? []).map((gift) => (
                <div key={gift.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/60">
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${gift.status === "gifted" ? "line-through opacity-60" : ""}`}
                    >
                      {gift.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {gift.reason}
                      {gift.price_range ? ` · ${gift.price_range}` : ""}
                    </p>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        updateGift.mutate({
                          id: gift.id,
                          status: gift.status === "gifted" ? "idea" : "gifted",
                        })
                      }
                    >
                      {gift.status === "gifted" ? "Undo" : "Gifted"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete idea"
                      onClick={() => deleteGift.mutate(gift.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 pt-4">
          <Card className="paper">
            <CardContent className="space-y-3 pt-6">
              <form
                className="space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (noteBody.trim()) addNote.mutate(noteBody);
                }}
              >
                <Textarea
                  rows={3}
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Something new you learned, a story, a change in their life…"
                />
                <Button type="submit" variant="outline">
                  <Plus className="size-4" /> Add note
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {(notes.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
            {(notes.data ?? []).map((note) => (
              <Card key={note.id} className="paper">
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{note.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <FriendForm open={editing} onOpenChange={setEditing} friend={friend} />
    </div>
  );
}
