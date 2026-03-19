import { z } from "zod";

// Input schema — what the user submits
export const createEventRequestSchema = z.object({
  rawInput: z
    .string()
    .min(10, "Please describe your event in at least 10 characters.")
    .max(500, "Description is too long. Keep it under 500 characters."),
});

// Shape of AI's structured JSON response (used for parsing + oRPC output)
export const venueProposalSchema = z.object({
  venueName: z.string(),
  location: z.string(),
  estimatedCost: z.string(),
  whyItFits: z.string(),
  amenities: z.array(z.string()),
});

// Full proposal with DB metadata
export const venueProposalWithMetaSchema = venueProposalSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  eventRequestId: z.string(),
});

// Full event request with nested proposal
export const eventRequestWithProposalSchema = z.object({
  id: z.string(),
  rawInput: z.string(),
  createdAt: z.string(),
  proposal: venueProposalWithMetaSchema.nullable(),
});