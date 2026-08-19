import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  BirthdayWish,
  Circle,
  CircleMember,
  Friend,
  FriendInterest,
  FriendNote,
  GiftIdea,
} from "./types";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return (result.data ?? []) as T;
}

export const friendsQuery = () =>
  queryOptions({
    queryKey: ["friends"],
    queryFn: async (): Promise<Friend[]> =>
      unwrap(await supabase.from("friends").select("*").order("name")),
  });

export const friendQuery = (id: string) =>
  queryOptions({
    queryKey: ["friend", id],
    queryFn: async (): Promise<Friend | null> => {
      const { data, error } = await supabase.from("friends").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

export const circlesQuery = () =>
  queryOptions({
    queryKey: ["circles"],
    queryFn: async (): Promise<Circle[]> =>
      unwrap(await supabase.from("circles").select("*").order("name")),
  });

export const circleMembersQuery = () =>
  queryOptions({
    queryKey: ["circle_members"],
    queryFn: async (): Promise<CircleMember[]> =>
      unwrap(await supabase.from("circle_members").select("*")),
  });

export const interestsQuery = () =>
  queryOptions({
    queryKey: ["friend_interests"],
    queryFn: async (): Promise<FriendInterest[]> =>
      unwrap(await supabase.from("friend_interests").select("*")),
  });

export const giftIdeasQuery = (friendId: string) =>
  queryOptions({
    queryKey: ["gift_ideas", friendId],
    queryFn: async (): Promise<GiftIdea[]> =>
      unwrap(
        await supabase
          .from("gift_ideas")
          .select("*")
          .eq("friend_id", friendId)
          .order("created_at", { ascending: false }),
      ),
  });

export const friendNotesQuery = (friendId: string) =>
  queryOptions({
    queryKey: ["friend_notes", friendId],
    queryFn: async (): Promise<FriendNote[]> =>
      unwrap(
        await supabase
          .from("friend_notes")
          .select("*")
          .eq("friend_id", friendId)
          .order("created_at", { ascending: false }),
      ),
  });

export const wishesQuery = () =>
  queryOptions({
    queryKey: ["birthday_wishes"],
    queryFn: async (): Promise<BirthdayWish[]> =>
      unwrap(await supabase.from("birthday_wishes").select("*")),
  });

export async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("You are signed out.");
  return data.user.id;
}
