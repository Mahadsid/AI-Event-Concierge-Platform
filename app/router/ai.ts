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

// Model Sstup 
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL_ID = "openai/gpt-oss-120b:free";
const model = openrouter.chat(MODEL_ID);

// ─── AI Prompt ────────────────────────────────────────────────────────────
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
    // 1. Save request first so history persists even if AI fails
    const eventRequest = await prisma.eventRequest.create({
      data: { rawInput: input.rawInput },
    });

    // 2. Call AI 
    let rawText: string;
      try {

      const { text } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt: input.rawInput,
        temperature: 0.4,
      });
        console.log("API KEY exists:", !!process.env.OPENROUTER_API_KEY)
        console.log("Calling OpenRouter with model:", MODEL_ID)
      rawText = text;
    } catch (err) {
      console.error("OpenRouter call failed:", err);
      await prisma.eventRequest.delete({ where: { id: eventRequest.id } });
      throw errors.INTERNAL_SERVER_ERROR({
        message: "AI service unavailable. Please try again.",
      });
    }

    // 3. Parse + validate AI response with Zod
    let proposalData: z.infer<typeof venueProposalSchema>;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      proposalData = venueProposalSchema.parse(parsed);
    } catch (err) {
      console.error("AI parse error. Raw response:", rawText);
      await prisma.eventRequest.delete({ where: { id: eventRequest.id } });
      throw errors.INTERNAL_SERVER_ERROR({
        message: "AI returned an unexpected format. Please try again.",
      });
    }

    // 4. Save proposal linked to request
    const proposal = await prisma.venueProposal.create({
      data: {
        ...proposalData,
        eventRequestId: eventRequest.id,
      },
    });

    // 5. Return full shape
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
