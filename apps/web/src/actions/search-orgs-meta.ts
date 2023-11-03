"use server";

import { z } from "zod";

import { db } from "@seocraft/supabase/db";

import { action } from "@/lib/safe-action";

export const searchOrgsMeta = action(
  z.object({
    query: z.string().optional(),
  }),
  async (params) => {
    return await db.transaction(async (tx) => {
      return await tx.query.project.findMany({
        where: (project, { or, ilike }) =>
          or(
            ilike(project.name, `%${params.query}%`),
            ilike(project.slug, `%${params.query}%`),
          ),
      });
    });
  },
);
