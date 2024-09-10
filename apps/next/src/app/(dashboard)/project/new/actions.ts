"use server";

import type { z } from "zod";

import { db, project, projectMembers, variable } from "@craftgen/db/db";

import { createClient } from "@/utils/supabase/server";

import type { newProjectSchema } from "./shared";

export const createNewProject = async (
  params: z.infer<typeof newProjectSchema>,
) => {
  const supabase = createClient();
  const session = await supabase.auth.getSession();
  return await db.transaction(async (tx) => {
    const [newProject] = await tx
      .insert(project)
      .values({
        name: params.name,
        site: params.site,
        slug: params.slug,
      })
      .returning();
    if (!newProject) {
      throw new Error("Failed to create project");
    }
    await tx.insert(projectMembers).values({
      projectId: newProject.id,
      userId: session.data.session?.user.id!,
      role: "owner",
    });

    await tx.insert(variable).values([
      {
        project_id: newProject.id,
        key: "OPENAI_API_KEY",
        provider: "OPENAI",
        system: true,
      },
      {
        project_id: newProject.id,
        key: "REPLICATE_API_KEY",
        provider: "REPLICATE",
        system: true,
      },
    ]);

    return newProject;
  });
};
