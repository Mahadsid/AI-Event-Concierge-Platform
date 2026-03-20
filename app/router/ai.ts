import { z } from "zod";
import { base } from "../middlewares/base";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import prisma from "@/lib/db";
import {
  createEventRequestSchema,
  venueProposalSchema,
  eventRequestWithProposalSchema,
} from "../schemas/event";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// ─── Model waterfall — tried in order until one succeeds ─────────────────────.
// gpt-oss-120b best quality → gpt-oss-20b fast + reliable → gemma fallback
const MODEL_WATERFALL = [
  { id: "openai/gpt-oss-120b:free",      name: "GPT-OSS 120B" },
  { id: "openai/gpt-oss-20b:free",       name: "GPT-OSS 20B"  },
  { id: "google/gemma-3n-e2b-it:free",   name: "Gemma 3n 2B"  },
] as const;

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert corporate event planning concierge.
Your job is to recommend a single venue for a corporate offsite based on the user's description.

You MUST respond with ONLY a valid JSON object. No markdown. No code blocks. No explanation. Just raw JSON.

The JSON must have exactly these fields:
{
  "venueName": "string — specific venue name (e.g. 'The Leela Palace, Udaipur')",
  "location": "string — city, state/region, country",
  "estimatedCost": "string — total cost range for the full event (e.g. '$3,200 – $4,000')",
  "whyItFits": "string — 2-3 sentences explaining why this venue matches the request",
  "amenities": ["array of 5-7 relevant amenity strings"]
}

Rules:
- Use real, specific venue names — not generic placeholders.
- estimatedCost must stay within the user's stated budget if one is given.
- whyItFits must reference specifics from their request (group size, duration, theme, budget).
- amenities must be relevant to the event type.
- If no location is mentioned, pick a suitable destination based on the event type.
- If no budget is mentioned, estimate a reasonable cost.`;

// ─── Helper — is this error a rate limit / temp unavailability? ───────────────
function isRetryableError(err: unknown): boolean {
  const msg = (err as any)?.message?.toLowerCase() ?? "";
  const status =
    (err as any)?.statusCode ??
    (err as any)?.lastError?.statusCode ??
    0;
  return (
    status === 429 ||
    status === 503 ||
    msg.includes("rate-limit") ||
    msg.includes("rate_limit") ||
    msg.includes("rate limited") ||
    msg.includes("temporarily") ||
    msg.includes("unavailable") ||
    msg.includes("retry")
  );
}

// ─── Procedure ────────────────────────────────────────────────────────────────
export const generateProposal = base
  .route({
    method: "POST",
    path: "/ai/generate-proposal",
    summary: "Generate a venue proposal from natural language",
    tags: ["AI"],
  })
  .input(createEventRequestSchema)
  .output(eventRequestWithProposalSchema)
  .handler(async ({ input, errors }) => {
    

    // 1. Save request first — history persists even if AI fails
    const eventRequest = await prisma.eventRequest.create({
      data: { rawInput: input.rawInput },
    });
    console.log("✅ EventRequest saved:", eventRequest.id);

    // 2. Try each model in waterfall order
    let rawText = "";
    let usedModel = "";

    for (const model of MODEL_WATERFALL) {
      try {
        console.log(`🤖 Trying model: ${model.name} (${model.id})`);

        const { text } = await generateText({
          model: openrouter.chat(model.id),
          system: SYSTEM_PROMPT,
          prompt: input.rawInput,
          temperature: 0.4,
          
        });

        rawText = text;
        usedModel = model.name;
        console.log(`✅ Got response from ${model.name}`);
        break; // success — stop trying other models

      } catch (err: unknown) {
        console.warn(`⚠️ ${model.name} failed:`, (err as any)?.message?.slice(0, 100));

        if (isRetryableError(err)) {
          // rate limited or temp down — try next model
          continue;
        }
        console.error(`❌ Non-retryable error from ${model.name}:`, err);
        await prisma.eventRequest.delete({ where: { id: eventRequest.id } }).catch(() => {});
        throw errors.INTERNAL_SERVER_ERROR({
          message: "AI service encountered an error. Please try again.",
        });
      }
    }

    // 3. All models failed (all rate limited)
    if (!rawText) {
      console.error("❌ All models in waterfall exhausted");
      await prisma.eventRequest.delete({ where: { id: eventRequest.id } }).catch(() => {});
      throw errors.INTERNAL_SERVER_ERROR({
        message: "AI is currently busy across all providers. Please try again in a minute.",
      });
    }

    console.log(`✅ Using response from: ${usedModel}`);

    // 4. Parse + Zod validate AI response
    let proposalData: z.infer<typeof venueProposalSchema>;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      proposalData = venueProposalSchema.parse(parsed);
      
    } catch (err) {
      console.error("❌ Parse error. Raw text:", rawText.slice(0, 200));
      await prisma.eventRequest.delete({ where: { id: eventRequest.id } }).catch(() => {});
      throw errors.INTERNAL_SERVER_ERROR({
        message: "AI returned an unexpected format. Please try again.",
      });
    }

    // 5. Save proposal linked to request
    const proposal = await prisma.venueProposal.create({
      data: {
        ...proposalData,
        eventRequestId: eventRequest.id,
      },
    });
    

    // 6. Return full shape
    return {
      id: eventRequest.id,
      rawInput: eventRequest.rawInput,
      createdAt: eventRequest.createdAt.toISOString(),
      proposal: {
        id: proposal.id,
        venueName: proposal.venueName,
        location: proposal.location,
        estimatedCost: proposal.estimatedCost,
        whyItFits: proposal.whyItFits,
        amenities: proposal.amenities,
        createdAt: proposal.createdAt.toISOString(),
        eventRequestId: proposal.eventRequestId,
      },
    };
  });
