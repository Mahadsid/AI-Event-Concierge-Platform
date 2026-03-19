import { z } from "zod";
import { base } from "../middlewares/base";
import prisma from "@/lib/db";
import { eventRequestWithProposalSchema } from "../schemas/event";

// Decision: GET /events returns all past requests+proposals, ordered newest first.
// No pagination for now (assignment scope). Server-side sorted = no client work needed.

export const listEventRequests = base
  .route({
    method: "GET",
    path: "/events",
    summary: "List all past event requests with proposals",
    tags: ["Events"],
  })
  .input(z.void())
  .output(z.object({ events: z.array(eventRequestWithProposalSchema) }))
  .handler(async ({ errors }) => {
    const events = await prisma.eventRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { proposal: true },
    });

    return {
      events: events.map((e) => ({
        id: e.id,
        rawInput: e.rawInput,
        createdAt: e.createdAt.toISOString(),
        proposal: e.proposal
          ? {
              id: e.proposal.id,
              venueName: e.proposal.venueName,
              location: e.proposal.location,
              estimatedCost: e.proposal.estimatedCost,
              whyItFits: e.proposal.whyItFits,
              amenities: e.proposal.amenities,
              createdAt: e.proposal.createdAt.toISOString(),
              eventRequestId: e.proposal.eventRequestId,
            }
          : null,
      })),
    };
  });

export const getEventRequest = base
  .route({
    method: "GET",
    path: "/events/{id}",
    summary: "Get a single event request by ID",
    tags: ["Events"],
  })
  .input(z.object({ id: z.string() }))
  .output(eventRequestWithProposalSchema)
  .handler(async ({ input, errors }) => {
    const event = await prisma.eventRequest.findUnique({
      where: { id: input.id },
      include: { proposal: true },
    });

    if (!event) throw errors.NOT_FOUND({ message: "Event request not found." });

    return {
      id: event.id,
      rawInput: event.rawInput,
      createdAt: event.createdAt.toISOString(),
      proposal: event.proposal
        ? {
            id: event.proposal.id,
            venueName: event.proposal.venueName,
            location: event.proposal.location,
            estimatedCost: event.proposal.estimatedCost,
            whyItFits: event.proposal.whyItFits,
            amenities: event.proposal.amenities,
            createdAt: event.proposal.createdAt.toISOString(),
            eventRequestId: event.proposal.eventRequestId,
          }
        : null,
    };
  });