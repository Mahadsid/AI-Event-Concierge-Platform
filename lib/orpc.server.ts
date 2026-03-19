import "server-only";
import { createRouterClient } from "@orpc/server";
import { router } from "@/app/router";

export const serverClient = createRouterClient(router, {
  context: {},
});