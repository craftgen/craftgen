"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";

import { db } from "@seocraft/supabase/db";

import { action } from "@/lib/safe-action";

export const searchModulesMeta = action(
  z.object({
    query: z.string().optional(),
    currentModuleId: z.string(),
  }),
  async (params) => {
    const supabase = createServerActionClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return await db.transaction(async (tx) => {
      const workflows = await tx.query.workflow.findMany({
        where: (workflow, { eq, or, ilike, and, not }) =>
          and(
            not(eq(workflow.id, params.currentModuleId)),
            or(
              eq(workflow.public, true),
              ilike(workflow.name, `%${params.query}%`),
              ilike(workflow.slug, `%${params.query}%`),
              ilike(workflow.projectSlug, `%${params.query}%`),
            ),
          ),
        limit: 10,
      });

      return workflows.map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
        slug: workflow.slug,
        owner: workflow.projectSlug,
      }));
    });
  },
);
