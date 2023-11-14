import { z } from "zod";

import { createTRPCRouter, openAiProducer } from "../../trpc";

export const assistantRouter = createTRPCRouter({
  list: openAiProducer
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx }) => {
      return ctx.openai.beta.assistants.list();
    }),

  retrive: openAiProducer
    .input(
      z.object({
        assistantId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.openai.beta.assistants.retrieve(input.assistantId);
    }),
});
