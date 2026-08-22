import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, Plus, Share2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { circleMembersQuery, circlesQuery, currentUserId, friendsQuery } from "@/lib/queries";
import { CIRCLE_COLORS, circleColorClass } from "@/lib/types";
import { circleSharesQuery } from "@/lib/sharing";
import { ShareCircleDialog } from "@/components/ShareCircleDialog";
import { Badge } from "@/components/ui/badge";
import { FriendAvatar } from "@/components/FriendAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/circles")({
  head: () => ({
    meta: [
      { title: "Circles — FriendCircles" },
      {
        name: "description",
        content:
          "Group your friends into circles — school, work, family, gaming — and see who belongs where.",
      },
      { property: "og:title", content: "Circles — FriendCircles" },
      {
        property: "og:description",
        content: "Organise friends into overlapping circles and see every group at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CirclesPage,
});

function CirclesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(CIRCLE_COLORS[0].value);

  const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    currentUserId()
      .then(setUserId)
      .catch(() => setUserId(null));
  }, []);

  const circles = useQuery(circlesQuery());
  const shares = useQuery(circleSharesQuery());
  const friends = useQuery(friendsQuery());
  const members = useQuery(circleMembersQuery());

  const friendById = new Map((friends.data ?? []).map((friend) => [friend.id, friend]));

  const createCircle = useMutation({
    mutationFn: async () => {
      const user_id = await currentUserId();
      const { error } = await supabase.from("circles").insert({
        user_id,
        name: name.trim(),
        description: description.trim() || null,
        color,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setName("");
      setDescription("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["circles"] });
      toast.success("Circle created");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteCircle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("circles").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles"] });
      queryClient.invalidateQueries({ queryKey: ["circle_members"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const leaveCircle = useMutation({
    mutationFn: async (circleId: string) => {
      const uid = await currentUserId();
      const { error } = await supabase
        .from("circle_shares")
        .delete()
        .eq("circle_id", circleId)
        .eq("shared_with_user_id", uid);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles"] });
      queryClient.invalidateQueries({ queryKey: ["circle_shares"] });
      toast.success("You left the circle");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Circles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A friend can belong to as many circles as you like.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New circle
        </Button>
      </div>

      {(circles.data ?? []).length === 0 && (
        <Card className="paper">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No circles yet. Create one for school, work, family or anything else.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(circles.data ?? []).map((circle) => {
          const circleFriends = (members.data ?? [])
            .filter((m) => m.circle_id === circle.id)
            .map((m) => friendById.get(m.friend_id))
            .filter(Boolean);
          const isOwner = userId != null && circle.user_id === userId;
          const sharedCount = (shares.data ?? []).filter((s) => s.circle_id === circle.id).length;
          return (
            <Card key={circle.id} className="paper">
              <CardHeader className="flex flex-row items-start gap-2 pb-3">
                <span className={`mt-1.5 size-3 rounded-full ${circleColorClass(circle.color)}`} />
                <div className="min-w-0">
                  <CardTitle className="font-display text-base">{circle.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {circle.description || `${circleFriends.length} members`}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {isOwner ? (
                    <>
                      {sharedCount > 0 && <Badge variant="secondary">Shared</Badge>}
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Share ${circle.name}`}
                        onClick={() => setShareTarget({ id: circle.id, name: circle.name })}
                      >
                        <Share2 className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${circle.name}`}
                        onClick={() => {
                          if (confirm(`Delete the circle "${circle.name}"?`))
                            deleteCircle.mutate(circle.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline">Shared with you</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Leave ${circle.name}`}
                        onClick={() => {
                          if (confirm(`Leave the circle "${circle.name}"?`))
                            leaveCircle.mutate(circle.id);
                        }}
                      >
                        <LogOut className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <CircleDuplicates circleId={circle.id} />
                {circleFriends.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No members yet — add this circle from a friend's profile.
                  </p>
                )}
                {circleFriends.map((friend) => (
                  <Link
                    key={friend!.id}
                    to="/friends/$friendId"
                    params={{ friendId: friend!.id }}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary"
                  >
                    <FriendAvatar
                      name={friend!.name}
                      photoUrl={friend!.photo_url}
                      className="size-8 text-xs"
                    />
                    <span className="truncate text-sm">{friend!.name}</span>
                    {friend!.linked_user_id === userId && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        You
                      </Badge>
                    )}
                  </Link>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {shareTarget && (
        <ShareCircleDialog
          circleId={shareTarget.id}
          circleName={shareTarget.name}
          open={shareTarget !== null}
          onOpenChange={(next) => !next && setShareTarget(null)}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">New circle</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) {
                toast.error("Give the circle a name.");
                return;
              }
              createCircle.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="circle-name">Name</Label>
              <Input
                id="circle-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="College crew"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="circle-desc">Description</Label>
              <Textarea
                id="circle-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Colour</Label>
              <div className="flex gap-2">
                {CIRCLE_COLORS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={option.label}
                    onClick={() => setColor(option.value)}
                    className={`size-8 rounded-full ${option.className} ${
                      color === option.value ? "ring-2 ring-foreground ring-offset-2" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCircle.isPending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
