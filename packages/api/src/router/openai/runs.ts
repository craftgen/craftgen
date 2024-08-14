import { z } from "zod";

import { createTRPCRouter, openAiProducer } from "../../trpc";

export const runsRouter = createTRPCRouter({
  retrieve: openAiProducer
    .input(
      z.object({
        threadId: z.string(),
        runId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.openai.beta.threads.runs.retrieve(input.threadId, input.runId);
    }),
});
