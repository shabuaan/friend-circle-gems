import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CircleInvite = Database["public"]["Tables"]["circle_invites"]["Row"];
export type CircleShare = Database["public"]["Tables"]["circle_shares"]["Row"];
export type CircleAccessRow = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
};

export const circleSharesQuery = () =>
  queryOptions({
    queryKey: ["circle_shares"],
    queryFn: async (): Promise<CircleShare[]> => {
      const { data, error } = await supabase.from("circle_shares").select("*");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

export const circleInvitesQuery = (circleId: string) =>
  queryOptions({
    queryKey: ["circle_invites", circleId],
    queryFn: async (): Promise<CircleInvite[]> => {
      const { data, error } = await supabase
        .from("circle_invites")
        .select("*")
        .eq("circle_id", circleId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

export const circleAccessQuery = (circleId: string) =>
  queryOptions({
    queryKey: ["circle_access", circleId],
    queryFn: async (): Promise<CircleAccessRow[]> => {
      const { data, error } = await supabase.rpc("circle_access_list", { _circle: circleId });
      if (error) throw new Error(error.message);
      return (data ?? []) as CircleAccessRow[];
    },
  });

export function inviteState(invite: CircleInvite): "pending" | "accepted" | "revoked" | "expired" {
  if (invite.status === "accepted") return "accepted";
  if (invite.status === "revoked") return "revoked";
  if (new Date(invite.expires_at).getTime() < Date.now()) return "expired";
  return "pending";
}

export function inviteLink(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/join/${token}`;
}
