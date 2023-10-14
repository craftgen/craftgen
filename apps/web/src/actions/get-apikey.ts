'use server';

import { action } from "@/lib/safe-action";
import { db } from "@seocraft/supabase/db";
import { z } from "zod";

// TODO: !!! security.
export const getApiKeyValue = action(z.object({
  projectId: z.string(),
  apiKey: z.string(),
}), async (params): Promise<string | null> => {
  const variable = await db.query.variable.findFirst({
    where: (variable, { eq, and }) =>
      and(
        eq(variable.key, params.apiKey),
        eq(variable.project_id, params.projectId)
      ),
  });
  return variable?.value!;
});
