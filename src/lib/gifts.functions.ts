import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const inputSchema = z.object({
  name: z.string(),
  interests: z.array(z.string()),
  favoriteColor: z.string().nullable(),
  favoriteFoods: z.string().nullable(),
  favoriteMedia: z.string().nullable(),
  wishlist: z.string().nullable(),
  dislikes: z.string().nullable(),
  budget: z.string(),
  occasion: z.string(),
  notes: z.string().nullable(),
});

export type AiGiftIdea = { title: string; reason: string };

export const generateGiftIdeas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<{ ideas: AiGiftIdea[]; error: string | null }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ideas: [], error: "AI is not configured for this app." };

    const { streamText, Output, NoObjectGeneratedError } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(apiKey, { structuredOutputs: true });

    const profile = [
      `Name: ${data.name}`,
      `Interests: ${data.interests.join(", ") || "unknown"}`,
      `Favourite colour: ${data.favoriteColor || "unknown"}`,
      `Favourite foods: ${data.favoriteFoods || "unknown"}`,
      `Favourite music/movies: ${data.favoriteMedia || "unknown"}`,
      `Wishlist notes: ${data.wishlist || "none"}`,
      `Dislikes / allergies: ${data.dislikes || "none"}`,
      `Other notes: ${data.notes || "none"}`,
      `Budget: ${data.budget}`,
      `Occasion: ${data.occasion}`,
    ].join("\n");

    const schema = z.object({
      ideas: z.array(
        z.object({
          title: z.string(),
          reason: z.string(),
        }),
      ),
    });

    try {
      const result = streamText({
        model: gateway("openai/gpt-5.6-sol"),
        output: Output.object({ schema }),
        providerOptions: { lovable: { reasoningEffort: "none" } },
        prompt:
          "You suggest thoughtful, specific birthday gifts for a friend based on their profile.\n" +
          "Return exactly 5 ideas. Each title is a concrete giftable item or experience (max 8 words) " +
          "that fits the stated budget and avoids anything in their dislikes. Each reason is one short " +
          "sentence (max 20 words) tying the gift to something specific in their profile.\n\n" +
          profile,
      });
      const output = await result.output;
      const ideas = (output?.ideas ?? [])
        .slice(0, 5)
        .map((idea) => ({ title: String(idea.title).slice(0, 120), reason: String(idea.reason).slice(0, 240) }));
      return { ideas, error: ideas.length ? null : "The AI didn't return any ideas. Try again." };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return { ideas: [], error: "The AI response was malformed. Please try again." };
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("429")) return { ideas: [], error: "Too many requests right now — try again shortly." };
      if (message.includes("402")) return { ideas: [], error: "AI credits are exhausted. Add credits to keep generating ideas." };
      console.error("Gift idea generation failed", error);
      return { ideas: [], error: "Couldn't generate ideas right now." };
    }
  });
