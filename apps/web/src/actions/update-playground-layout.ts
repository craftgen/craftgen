"use server";

import { db, workflow, eq } from "@seocraft/supabase/db";
import type * as FlexLayout from "flexlayout-react";

export const updatePlaygroundLayout = async (params: {
  playgroundId: string;
  layout: FlexLayout.IJsonModel;
}) => {
  return await db
    .update(workflow)
    .set({ layout: params.layout })
    .where(eq(workflow.id, params.playgroundId))
    .returning();
};
