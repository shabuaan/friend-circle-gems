import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { circleDuplicatesQuery, type DuplicateSuggestion } from "@/lib/duplicates";
import { MergeDuplicateDialog } from "@/components/MergeDuplicateDialog";
import { Button } from "@/components/ui/button";

export function CircleDuplicates({ circleId }: { circleId: string }) {
  const duplicates = useQuery(circleDuplicatesQuery(circleId));
  const [active, setActive] = useState<DuplicateSuggestion | null>(null);

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
          <Button size="sm" onClick={() => setActive(row)}>
            Review match
          </Button>
        </div>
      ))}

      {active && (
        <MergeDuplicateDialog
          row={active}
          circleId={circleId}
          open={active !== null}
          onOpenChange={(next) => !next && setActive(null)}
        />
      )}
    </div>
  );
}
