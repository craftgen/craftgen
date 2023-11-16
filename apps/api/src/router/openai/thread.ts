import { z } from "zod";

import { createTRPCRouter, openAiProducer } from "../../trpc";
import { runsRouter } from "./runs";

export const threadRouter = createTRPCRouter({
  runs: runsRouter,
  retrieve: openAiProducer
    .input(
      z.object({
        threadId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.openai.beta.threads.retrieve(input.threadId);
    }),

  messages: openAiProducer
    .input(
      z.object({
        threadId: z.string(),
        cursor: z.string().optional(), // <-- "cursor" needs to exist, but can be any type
      }),
    )
    .query(async ({ ctx, input }) => {
      const res = await ctx.openai.beta.threads.messages.list(input.threadId, {
        order: "asc",
        after: input.cursor,
      });
      const nextPage = res.nextPageInfo();
      return {
        data: res.data,
        cursor: nextPage ? (nextPage as any).params.after : null,
      };
    }),
});
