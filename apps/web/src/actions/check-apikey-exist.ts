"use server";

import { z } from "zod";

import { db } from "@craftgen/db/db";

import { action } from "@/lib/safe-action";

export const checkAPIKeyExist = action(
  z.object({ projectId: z.string(), key: z.string() }),
  async ({ projectId, key }) => {
    const variable = await db.query.variable.findFirst({
      where: (variable, { eq, and }) =>
        and(eq(variable.key, key), eq(variable.project_id, projectId)),
    });
    if (!variable) throw new Error("API Key not found");
    return !!variable.value;
  },
);
