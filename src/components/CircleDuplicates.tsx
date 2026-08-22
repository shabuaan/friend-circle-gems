import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { circleDuplicatesQuery, dismissDuplicate, mergeFriends } from "@/lib/duplicates";
import { currentUserId } from "@/lib/queries";
import { Button } from "@/components/ui/button";

export function CircleDuplicates({ circleId }: { circleId: string }) {
  const queryClient = useQueryClient();
  const duplicates = useQuery(circleDuplicatesQuery(circleId));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["circle_duplicates", circleId] });
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    queryClient.invalidateQueries({ queryKey: ["circle_members"] });
  };

  const merge = useMutation({
    mutationFn: ({ keep, drop }: { keep: string; drop: string }) => mergeFriends(keep, drop),
    onSuccess: () => {
      invalidate();
      toast.success("Profiles merged");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const dismiss = useMutation({
    mutationFn: async ({ a, b }: { a: string; b: string }) => {
      const uid = await currentUserId();
      await dismissDuplicate(uid, a, b);
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = duplicates.data ?? [];
  if (rows.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
      {rows.map((row) => (
        <div key={`${row.mine_id}-${row.other_id}`} className="space-y-2">
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Users className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>
              <span className="font-medium text-foreground">{row.mine_name}</span> looks like the
              same person as{" "}
              <span className="font-medium text-foreground">{row.other_name}</span>
              {row.other_is_self ? ", who just joined this circle" : ""} (matching {row.reason}).
            </span>
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={merge.isPending}
              onClick={() => merge.mutate({ keep: row.other_id, drop: row.mine_id })}
            >
              Merge into their profile
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={dismiss.isPending}
              onClick={() => dismiss.mutate({ a: row.mine_id, b: row.other_id })}
            >
              Keep both
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
