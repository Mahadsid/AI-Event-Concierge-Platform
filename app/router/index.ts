import { os } from "@orpc/server";
import { eventRouter } from "../modules/event/event.router";

export const appRouter = os.router({
  event: eventRouter,
});

export type AppRouter = typeof appRouter;