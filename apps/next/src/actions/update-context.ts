"use server";

import { z } from "zod";

import { context, db, eq } from "@craftgen/db/db";

import { action } from "@/lib/safe-action";

export const setContext = action(
  z.object({
    contextId: z.string(),
    context: z.string().transform((val) => JSON.parse(val)),
  }),
  async (input) => {
    return await db
      .update(context)
      .set({ state: input.context as any })
      .where(eq(context.id, input.contextId))
      .returning();
  },
);
