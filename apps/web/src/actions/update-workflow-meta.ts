"use server";

import { db, eq, workflow } from "@seocraft/supabase/db";

export const updateWorkflowMeta = async (
  playgroundId: string,
  args: {
    name: string;
    description?: string;
    public: boolean;
  },
) => {
  return await db
    .update(workflow)
    .set(args)
    .where(eq(workflow.id, playgroundId))
    .returning();
};
