import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CreateInviteInput = {
  circleId: string;
  email?: string | null;
  origin: string;
};

export const createCircleInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CreateInviteInput) => {
    if (!data?.circleId) throw new Error("Missing circle.");
    if (!data?.origin?.startsWith("http")) throw new Error("Missing app URL.");
    const email = data.email?.trim() || null;
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("That email doesn't look right.");
    return { circleId: data.circleId, email, origin: data.origin.replace(/\/$/, "") };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: circle, error: circleError } = await supabase
      .from("circles")
      .select("id, name, user_id")
      .eq("id", data.circleId)
      .maybeSingle();
    if (circleError) throw new Error(circleError.message);
    if (!circle || circle.user_id !== userId) throw new Error("Only the circle owner can share it.");

    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 12);

    const { data: invite, error } = await supabase
      .from("circle_invites")
      .insert({ circle_id: circle.id, owner_id: userId, token, invited_email: data.email })
      .select("id, token, invited_email, status, expires_at, created_at")
      .single();
    if (error) throw new Error(error.message);

    const link = `${data.origin}/join/${token}`;

    let emailed: { sent: boolean; reason?: string } = { sent: false };
    if (data.email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();
      const { sendInviteEmail } = await import("./invite-email.server");
      emailed = await sendInviteEmail({
        to: data.email,
        circleName: circle.name,
        inviterName: profile?.display_name || "A friend",
        link,
      });
    }

    return { invite, link, emailed };
  });
