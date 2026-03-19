import { os } from "@orpc/server";
import { base } from "@/app/middlewares/base";
import { createEventSchema } from "./event.schema";
import {
  createEventRequest,
  getAllEventRequests,
} from "./event_service";

export const eventRouter = os.router({
  create: base
    .input(createEventSchema)
    .handler(async ({ input }) => {
      // TEMP placeholder AI response (we’ll replace later)
      const fakeAIResponse = {
        venueName: "Placeholder Resort",
        location: "Himachal Pradesh",
        estimatedCost: "$3000",
        whyItFits: "This is a placeholder until AI is integrated.",
      };

      const result = await createEventRequest(
        input.prompt,
        fakeAIResponse
      );

      return result;
    }),

  list: base.handler(async () => {
    return await getAllEventRequests();
  }),
});