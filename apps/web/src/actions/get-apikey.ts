"use server";

import { z } from "zod";

import { db } from "@craftgen/db/db";

import { action } from "@/lib/safe-action";

// TODO: !!! security.
export const getApiKeyValue = action(
  z.object({
    projectId: z.string(),
    apiKey: z.string(),
  }),
  async (input): Promise<string | null> => {
    const variable = await db.query.variable.findFirst({
      where: (variable, { eq, and }) =>
        and(
          eq(variable.key, input.apiKey),
          eq(variable.project_id, input.projectId),
        ),
    });
    return variable?.value!;
  },
);
