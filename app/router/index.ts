import { os } from "@orpc/server"
import { z } from "zod"
import { generateProposal } from "./ai";
import { listEventRequests, getEventRequest } from "./event";

// TEMP: test procedure with NO context requirement
const pingTest = os
  .input(z.object({ message: z.string() }))
  .handler(async ({ input }) => {
    return { pong: input.message }
  })

export const router = {
  ai: {
    generateProposal,
  },
  event: {
    list: listEventRequests,
    get: getEventRequest,
  },
  // TEMP
  ping: pingTest,
}

export type AppRouter = typeof router
