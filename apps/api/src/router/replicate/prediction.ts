import { z } from "zod";

import { createTRPCRouter, replicateProducer } from "../../trpc";

export const replicatePredictionRouter = createTRPCRouter({
  run: replicateProducer
    .input(
      z.object({
        identifier: z.object({
          owner: z.string(),
          model_name: z.string(),
          version_id: z.string(),
        }),
        input: z.any(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.replicate.run(
        `${input.identifier.owner}/${input.identifier.model_name}:${input.identifier.version_id}`,
        {
          input: input.input,
        },
      );
      return res;
    }),
  create: replicateProducer
    .input(
      z.object({
        identifier: z.object({
          owner: z.string(),
          model_name: z.string(),
          version_id: z.string(),
        }),
        input: z.any(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.replicate.predictions.create({
        version: input.identifier.version_id,
        input: input.input,
      });
      return res;
    }),
  get: replicateProducer
    .input(
      z.object({
        prediction_id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const res = await ctx.replicate.predictions.get(input.prediction_id);
      return res;
    }),
  cancel: replicateProducer
    .input(
      z.object({
        prediction_id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.replicate.predictions.cancel(input.prediction_id);
      return res;
    }),
  // wait: replicateProducer
  //   .input(
  //     z.object({
  //       prediction_id: z.string(),
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     const res = await ctx.replicate.wait(input.prediction_id);
  //     return res;
  //   }),
});
