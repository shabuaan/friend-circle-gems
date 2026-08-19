import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export type Friend = Tables["friends"]["Row"];
export type Circle = Tables["circles"]["Row"];
export type CircleMember = Tables["circle_members"]["Row"];
export type FriendInterest = Tables["friend_interests"]["Row"];
export type GiftIdea = Tables["gift_ideas"]["Row"];
export type FriendNote = Tables["friend_notes"]["Row"];
export type BirthdayWish = Tables["birthday_wishes"]["Row"];

export const CIRCLE_COLORS = [
  { value: "terracotta", label: "Terracotta", className: "bg-chart-1" },
  { value: "sage", label: "Sage", className: "bg-chart-2" },
  { value: "sky", label: "Sky", className: "bg-chart-3" },
  { value: "honey", label: "Honey", className: "bg-chart-4" },
  { value: "plum", label: "Plum", className: "bg-chart-5" },
] as const;

export function circleColorClass(color: string | null | undefined): string {
  return CIRCLE_COLORS.find((c) => c.value === color)?.className ?? "bg-chart-1";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
