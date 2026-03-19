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

// import { z } from "zod";
// import { base } from "../middlewares/base";
// import prisma from "@/lib/db";
// import {
//   createEventRequestSchema,
//   venueProposalSchema,
//   eventRequestWithProposalSchema,
// } from "../schemas/event";

// const MODEL_ID = "openai/gpt-oss-120b:free";

// const SYSTEM_PROMPT = `You are an expert corporate event planning concierge.
// Your job is to recommend a single venue for a corporate offsite based on the user's description.

// You MUST respond with ONLY a valid JSON object. No markdown. No code blocks. No explanation. Just raw JSON.

// The JSON must have exactly these fields:
// {
//   "venueName": "string — specific venue name",
//   "location": "string — city, state/region, country",
//   "estimatedCost": "string — total cost range (e.g. '$3,200 – $4,000')",
//   "whyItFits": "string — 2-3 sentences explaining why this venue matches the request",
//   "amenities": ["array of 5-7 relevant amenity strings"]
// }

// Rules:
// - Use real, specific venue names.
// - estimatedCost must stay within the user's stated budget if given.
// - whyItFits must reference specifics from their request.
// - If no location is mentioned, pick a suitable destination.
// - If no budget is mentioned, estimate a reasonable cost.`;

// export const generateProposal = base
//   .route({
//     method: "POST",
//     path: "/ai/generate-proposal",
//     summary: "Generate a venue proposal from natural language",
//     tags: ["AI"],
//   })
//   .input(createEventRequestSchema)
//   .output(eventRequestWithProposalSchema)
//   .handler(async ({ input, errors }) => {
//     console.log("✅ Handler reached, rawInput:", input.rawInput);
//     console.log("✅ API Key exists:", !!process.env.OPENROUTER_API_KEY);
//     console.log("✅ API Key prefix:", process.env.OPENROUTER_API_KEY?.slice(0, 8));

//     // 1. Save request first
//     const eventRequest = await prisma.eventRequest.create({
//       data: { rawInput: input.rawInput },
//     });
//     console.log("✅ EventRequest saved:", eventRequest.id);

//     // 2. Call OpenRouter via direct fetch — no AI SDK dependency
//     let rawText: string;
//     try {
//       const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
//           "Content-Type": "application/json",
//           "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
//           "X-Title": "AI Event Concierge",
//         },
//         body: JSON.stringify({
//           model: MODEL_ID,
//           messages: [
//             { role: "system", content: SYSTEM_PROMPT },
//             { role: "user", content: input.rawInput },
//           ],
//           temperature: 0.4,
//           max_tokens: 800,
//         }),
//       });

//       console.log("✅ OpenRouter status:", aiResponse.status);
//       const data = await aiResponse.json();
//       console.log("✅ OpenRouter raw response:", JSON.stringify(data, null, 2));

//       if (!aiResponse.ok) {
//         await prisma.eventRequest.delete({ where: { id: eventRequest.id } });
//         throw errors.INTERNAL_SERVER_ERROR({
//           message: `AI service error: ${data?.error?.message ?? "Unknown error"}`,
//         });
//       }

//       rawText = data.choices?.[0]?.message?.content ?? "";
//       console.log("✅ Raw AI text:", rawText);

//     } catch (err) {
//       console.error("❌ Fetch to OpenRouter failed:", err);
//       await prisma.eventRequest.delete({ where: { id: eventRequest.id } });
//       throw errors.INTERNAL_SERVER_ERROR({
//         message: "Failed to reach AI service.",
//       });
//     }

//     // 3. Parse + Zod validate AI response
//     let proposalData: z.infer<typeof venueProposalSchema>;
//     try {
//       const cleaned = rawText.replace(/```json|```/g, "").trim();
//       console.log("✅ Cleaned AI text:", cleaned);
//       const parsed = JSON.parse(cleaned);
//       proposalData = venueProposalSchema.parse(parsed);
//       console.log("✅ Proposal parsed successfully");
//     } catch (err) {
//       console.error("❌ Parse error. Raw text was:", rawText);
//       await prisma.eventRequest.delete({ where: { id: eventRequest.id } });
//       throw errors.INTERNAL_SERVER_ERROR({
//         message: "AI returned unexpected format. Please try again.",
//       });
//     }

//     // 4. Save proposal
//     const proposal = await prisma.venueProposal.create({
//       data: {
//         ...proposalData,
//         eventRequestId: eventRequest.id,
//       },
//     });
//     console.log("✅ Proposal saved:", proposal.id);

//     // 5. Return
//     return {
//       id: eventRequest.id,
//       rawInput: eventRequest.rawInput,
//       createdAt: eventRequest.createdAt.toISOString(),
//       proposal: {
//         id: proposal.id,
//         venueName: proposal.venueName,
//         location: proposal.location,
//         estimatedCost: proposal.estimatedCost,
//         whyItFits: proposal.whyItFits,
//         amenities: proposal.amenities,
//         createdAt: proposal.createdAt.toISOString(),
//         eventRequestId: proposal.eventRequestId,
//       },
//     };
//   });