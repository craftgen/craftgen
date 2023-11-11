import { z } from "zod";

import { createTRPCRouter, openAiProducer } from "../../trpc";

export const threadRouter = createTRPCRouter({
  retrieve: openAiProducer
    .input(
      z.object({
        threadId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.openai.beta.threads.retrieve(input.threadId);
    }),
});
