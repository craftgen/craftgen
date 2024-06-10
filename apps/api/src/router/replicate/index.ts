import { ModelVersion, Page } from "replicate";
import { z } from "zod";

import { convertOpenAPIToJSONSchema } from "@craftgen/utils";

import { createTRPCRouter, replicateProducer } from "../../trpc";
import { replicatePredictionRouter } from "./prediction";

export const replicateRouter = createTRPCRouter({
  predict: replicatePredictionRouter,

  getModelVersion: replicateProducer
    .input(
      z.object({
        owner: z.string(),
        model_name: z.string(),
        version_id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const res = await ctx.replicate.models.versions.get(
        input.owner,
        input.model_name,
        input.version_id,
      );
      const schema = await convertOpenAPIToJSONSchema(
        res.openapi_schema as any,
      );
      return {
        ...res,
        schema,
      };
    }),
  versions: replicateProducer
    .input(
      z.object({
        owner: z.string(),
        model_name: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const res = (await ctx.replicate.models.versions.list(
        input.owner,
        input.model_name,
      )) as unknown as Page<ModelVersion>;
      return res;
    }),
  getCollections: replicateProducer
    .input(
      z.object({
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx }) => {
      const data = await ctx.replicate.collections.list();
      return data;
    }),
  getCollection: replicateProducer
    .input(
      z.object({
        collection_slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const data = await ctx.replicate.collections.get(input.collection_slug);
      return data;
    }),
});
