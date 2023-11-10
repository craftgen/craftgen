import { z } from "zod";

import { createTRPCRouter, openAiProducer } from "../trpc";

export const openaiRouter = createTRPCRouter({
  assistant: createTRPCRouter({
    list: openAiProducer
      .input(
        z.object({
          projectId: z.string(),
        }),
      )
      .query(async ({ ctx }) => {
        return ctx.openai.beta.assistants.list();
      }),
  }),
});
