import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Check, Mail, User } from "lucide-react";
import {
  type DuplicateSuggestion,
  mergeFriends,
  mergePreviewQuery,
  dismissDuplicate,
} from "@/lib/duplicates";
import { currentUserId } from "@/lib/queries";
import type { Friend } from "@/lib/types";
import { FriendAvatar } from "@/components/FriendAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FIELDS: { key: keyof Friend; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "nickname", label: "Nickname" },
  { key: "birthday", label: "Birthday" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "how_we_met", label: "How we met" },
  { key: "favorite_color", label: "Favourite colour" },
  { key: "favorite_foods", label: "Favourite foods" },
  { key: "favorite_media", label: "Favourite media" },
  { key: "clothing_size", label: "Clothing size" },
  { key: "shoe_size", label: "Shoe size" },
  { key: "wishlist", label: "Wishlist" },
  { key: "dislikes", label: "Dislikes" },
  { key: "notes", label: "Notes" },
];

const str = (value: unknown) =>
  value === null || value === undefined || value === "" ? null : String(value);

export function MergeDuplicateDialog({
  row,
  circleId,
  open,
  onOpenChange,
}: {
  row: DuplicateSuggestion;
  circleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setConfirmed(false);
    }
  }, [open]);

  // The joined/other card survives; your own card is folded into it.
  const preview = useQuery({ ...mergePreviewQuery(row.other_id, row.mine_id), enabled: open });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["circle_duplicates", circleId] });
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    queryClient.invalidateQueries({ queryKey: ["circle_members"] });
  };

  const merge = useMutation({
    mutationFn: () => mergeFriends(row.other_id, row.mine_id),
    onSuccess: () => {
      invalidate();
      onOpenChange(false);
      toast.success("Profiles merged");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const dismiss = useMutation({
    mutationFn: async () => {
      const uid = await currentUserId();
      await dismissDuplicate(uid, row.mine_id, row.other_id);
    },
    onSuccess: () => {
      invalidate();
      onOpenChange(false);
      toast.success("Kept both profiles");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const keep = preview.data?.keep;
  const drop = preview.data?.drop;

  const rows = FIELDS.map((field) => {
    const kept = str(keep?.[field.key]);
    const dropped = str(drop?.[field.key]);
    const filled = kept === null && dropped !== null;
    return { ...field, kept, dropped, filled };
  }).filter((r) => r.kept !== null || r.dropped !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {step === 1 ? "Is this the same person?" : "Preview the merge"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Confirm the matching rule before anything is combined."
              : "Nothing is lost — empty fields on the surviving profile are filled from yours."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-secondary/40 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                {row.reason === "email" ? (
                  <Mail className="size-4 text-primary" />
                ) : (
                  <User className="size-4 text-primary" />
                )}
                Matched on {row.reason === "email" ? "the same email address" : "an identical name"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.reason === "email"
                  ? "Both cards use the same email address, ignoring capitalisation."
                  : "Both names are identical once spacing and capitalisation are ignored. Name matches can be wrong for common names — check carefully."}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <CardSide
                title="Your card"
                subtitle="Will be removed after merging"
                friend={drop}
                fallbackName={row.mine_name}
              />
              <CardSide
                title="Their profile"
                subtitle={row.other_is_self ? "Joined this circle" : "Kept as the survivor"}
                friend={keep}
                fallbackName={row.other_name}
                highlight
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id={`confirm-${row.mine_id}`}
                checked={confirmed}
                onCheckedChange={(value) => setConfirmed(value === true)}
              />
              <Label
                htmlFor={`confirm-${row.mine_id}`}
                className="text-sm leading-snug font-normal"
              >
                I confirm {row.mine_name} and {row.other_name} are the same person.
              </Label>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={dismiss.isPending}
                onClick={() => dismiss.mutate()}
              >
                Keep both
              </Button>
              <Button type="button" disabled={!confirmed} onClick={() => setStep(2)}>
                Review merge <ArrowRight className="size-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {preview.isLoading && (
              <p className="text-sm text-muted-foreground">Loading both profiles…</p>
            )}
            {preview.error && (
              <p className="text-sm text-destructive">{(preview.error as Error).message}</p>
            )}

            {keep && drop && (
              <>
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/50 text-muted-foreground">
                      <tr>
                        <th className="p-2 font-medium">Field</th>
                        <th className="p-2 font-medium">Result after merge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={String(r.key)} className="border-t align-top">
                          <td className="p-2 text-muted-foreground">{r.label}</td>
                          <td className="p-2">
                            <span className="break-words">{r.kept ?? r.dropped}</span>
                            {r.filled && (
                              <Badge variant="secondary" className="ml-2 text-[10px]">
                                from your card
                              </Badge>
                            )}
                            {r.kept !== null && r.dropped !== null && r.kept !== r.dropped && (
                              <p className="mt-0.5 text-[11px] text-muted-foreground line-through">
                                {r.dropped}
                              </p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="space-y-1 text-xs text-muted-foreground">
                  <MoveLine n={preview.data!.moving.interests} label="interest" />
                  <MoveLine n={preview.data!.moving.notes} label="note" />
                  <MoveLine n={preview.data!.moving.gifts} label="gift idea" />
                  <MoveLine n={preview.data!.moving.circles} label="circle membership" />
                  <li className="flex items-center gap-2 text-destructive">
                    <Check className="size-3.5" /> Your card “{drop.name}” is deleted afterwards.
                  </li>
                </ul>
              </>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                type="button"
                disabled={merge.isPending || !keep || !drop}
                onClick={() => merge.mutate()}
              >
                Merge profiles
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MoveLine({ n, label }: { n: number; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="size-3.5 text-primary" />
      {n} {label}
      {n === 1 ? "" : "s"} moved over
    </li>
  );
}

function CardSide({
  title,
  subtitle,
  friend,
  fallbackName,
  highlight,
}: {
  title: string;
  subtitle: string;
  friend?: Friend | undefined;
  fallbackName: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-primary/50 bg-primary/5" : ""}`}>
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{title}</p>
      <div className="mt-2 flex items-center gap-2">
        <FriendAvatar
          name={friend?.name ?? fallbackName}
          photoUrl={friend?.photo_url ?? null}
          className="size-9 text-xs"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{friend?.name ?? fallbackName}</p>
          <p className="truncate text-xs text-muted-foreground">{friend?.email ?? subtitle}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}
