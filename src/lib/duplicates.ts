import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
