import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Link2, Mail, Trash2, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createCircleInvite } from "@/lib/sharing.functions";
import { circleAccessQuery, circleInvitesQuery, inviteLink, inviteState } from "@/lib/sharing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  circleId: string;
  circleName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShareCircleDialog({ circleId, circleName, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [lastLink, setLastLink] = useState<string | null>(null);
  const createInvite = useServerFn(createCircleInvite);

  const invites = useQuery({ ...circleInvitesQuery(circleId), enabled: open });
  const access = useQuery({ ...circleAccessQuery(circleId), enabled: open });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["circle_invites", circleId] });
    queryClient.invalidateQueries({ queryKey: ["circle_access", circleId] });
  };

  const invite = useMutation({
    mutationFn: async (withEmail: boolean) =>
      createInvite({
        data: {
          circleId,
          email: withEmail ? email.trim() : null,
          origin: window.location.origin,
        },
      }),
    onSuccess: async (result, withEmail) => {
      setLastLink(result.link);
      refresh();
      if (withEmail) {
        setEmail("");
        if (result.emailed.sent) toast.success("Invite email sent");
        else toast.message(result.emailed.reason ?? "Invite created — copy the link below.");
      } else {
        await copy(result.link);
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("circle_invites")
        .update({ status: "revoked" })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      refresh();
      toast.success("Link revoked");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeCoOwner = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("circle_shares")
        .delete()
        .eq("circle_id", circleId)
        .eq("shared_with_user_id", userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      refresh();
      queryClient.invalidateQueries({ queryKey: ["circle_shares"] });
      toast.success("Access removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function copy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast.message(link);
    }
  }

  const pending = (invites.data ?? []).filter((i) => inviteState(i) === "pending");
  const past = (invites.data ?? []).filter((i) => inviteState(i) !== "pending");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Share “{circleName}”</DialogTitle>
          <DialogDescription>
            Co-owners can view and edit this circle and the friends in it. Every link works once and
            expires after 14 days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => invite.mutate(false)}
              disabled={invite.isPending}
            >
              <Link2 className="size-4" /> Create single-use invite link
            </Button>
            {lastLink && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-2">
                <span className="min-w-0 flex-1 truncate text-xs">{lastLink}</span>
                <Button size="sm" variant="ghost" onClick={() => copy(lastLink)}>
                  <Copy className="size-3.5" /> Copy
                </Button>
              </div>
            )}
          </div>

          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!email.trim()) {
                toast.error("Enter an email address.");
                return;
              }
              invite.mutate(true);
            }}
          >
            <Label htmlFor="invite-email">Invite by email</Label>
            <div className="flex gap-2">
              <Input
                id="invite-email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Button type="submit" variant="secondary" disabled={invite.isPending}>
                <Mail className="size-4" /> Send
              </Button>
            </div>
          </form>

          <section className="space-y-2">
            <h3 className="text-sm font-medium">People with access</h3>
            {(access.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Only you, for now.</p>
            )}
            {(access.data ?? []).map((person) => (
              <div
                key={person.user_id}
                className="flex items-center gap-2 rounded-lg border border-border p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{person.display_name || person.email || "Co-owner"}</p>
                  {person.email && (
                    <p className="truncate text-xs text-muted-foreground">{person.email}</p>
                  )}
                </div>
                <Badge variant="secondary">Co-owner</Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Remove access"
                  onClick={() => removeCoOwner.mutate(person.user_id)}
                >
                  <UserMinus className="size-4" />
                </Button>
              </div>
            ))}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium">Invite links</h3>
            {pending.length === 0 && past.length === 0 && (
              <p className="text-sm text-muted-foreground">No invites yet.</p>
            )}
            {pending.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-lg border border-border p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.invited_email || "Shareable link"}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {new Date(item.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => copy(inviteLink(item.token))}>
                  <Copy className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Revoke link"
                  onClick={() => revoke.mutate(item.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {past.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-lg border border-dashed border-border p-2 text-muted-foreground"
              >
                <span className="min-w-0 flex-1 truncate text-sm">
                  {item.invited_email || "Shareable link"}
                </span>
                <Badge variant="outline" className="capitalize">
                  {inviteState(item)}
                </Badge>
              </div>
            ))}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
