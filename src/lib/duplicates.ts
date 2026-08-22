import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Friend } from "./types";

export type DuplicateSuggestion = {
  mine_id: string;
  mine_name: string;
  other_id: string;
  other_name: string;
  other_is_self: boolean;
  reason: string;
};

export const circleDuplicatesQuery = (circleId: string) =>
  queryOptions({
    queryKey: ["circle_duplicates", circleId],
    queryFn: async (): Promise<DuplicateSuggestion[]> => {
      const { data, error } = await supabase.rpc("find_circle_duplicates", { _circle: circleId });
      if (error) throw new Error(error.message);
      return (data ?? []) as DuplicateSuggestion[];
    },
  });

export type MergePreview = {
  keep: Friend;
  drop: Friend;
  moving: { interests: number; notes: number; gifts: number; circles: number };
};

async function count(table: "friend_interests" | "friend_notes" | "gift_ideas" | "circle_members", friendId: string) {
  const { count: n } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("friend_id", friendId);
  return n ?? 0;
}

export const mergePreviewQuery = (keepId: string, dropId: string) =>
  queryOptions({
    queryKey: ["merge_preview", keepId, dropId],
    queryFn: async (): Promise<MergePreview> => {
      const { data, error } = await supabase
        .from("friends")
        .select("*")
        .in("id", [keepId, dropId]);
      if (error) throw new Error(error.message);
      const keep = (data ?? []).find((f) => f.id === keepId);
      const drop = (data ?? []).find((f) => f.id === dropId);
      if (!keep || !drop) throw new Error("Could not load both profiles.");
      const [interests, notes, gifts, circles] = await Promise.all([
        count("friend_interests", dropId),
        count("friend_notes", dropId),
        count("gift_ideas", dropId),
        count("circle_members", dropId),
      ]);
      return { keep, drop, moving: { interests, notes, gifts, circles } };
    },
  });

export async function mergeFriends(keepId: string, dropId: string): Promise<void> {
  const { error } = await supabase.rpc("merge_friends", { _keep: keepId, _drop: dropId });
  if (error) throw new Error(error.message);
}

export async function dismissDuplicate(
  userId: string,
  friendA: string,
  friendB: string,
): Promise<void> {
  const { error } = await supabase
    .from("duplicate_dismissals")
    .insert({ user_id: userId, friend_a: friendA, friend_b: friendB });
  if (error) throw new Error(error.message);
}
