"use server";

import type * as FlexLayout from "flexlayout-react";

import { db, eq, workflow } from "@seocraft/supabase/db";

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
