import prisma from "@/lib/prisma";


export const createEventRequest = async (
  userInput: string,
  aiResponse: any
) => {
  return await prisma.eventRequest.create({
    data: {
      userInput,
      aiResponse,
    },
  });
};

export const getAllEventRequests = async () => {
  return await prisma.eventRequest.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};