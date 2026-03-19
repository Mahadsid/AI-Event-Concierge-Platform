import { z } from "zod";

export const createEventSchema = z.object({
  prompt: z
    .string()
    .min(10, "Please provide a more detailed description"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;