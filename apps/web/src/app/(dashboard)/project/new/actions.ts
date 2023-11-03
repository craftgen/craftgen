"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { google } from "googleapis";
import { z } from "zod";

import { db, project, projectMembers, variable } from "@seocraft/supabase/db";

import { getGoogleAuth } from "@/lib/google/auth";

import { newProjectSchema, normalizeUrl } from "./shared";

export const getSites = async () => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();
  const googleAuth = await getGoogleAuth({ session: session.data.session! });

  const webmaster = google.webmasters({
    version: "v3",
    auth: googleAuth,
  });
  const sites = await webmaster.sites.list();
  return sites.data.siteEntry?.map((site) => ({
    url: normalizeUrl(site.siteUrl!),
    ...site,
  }));
};

export const createNewProject = async (
  params: z.infer<typeof newProjectSchema>,
) => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();
  return await db.transaction(async (tx) => {
    const newProject = await tx
      .insert(project)
      .values({
        name: params.name,
        site: params.site,
        slug: params.slug,
      })
      .returning();
    await tx.insert(projectMembers).values({
      projectId: newProject[0].id,
      userId: session.data.session?.user.id!,
      role: "owner",
    });

    await tx.insert(variable).values([
      {
        project_id: newProject[0].id,
        key: "OPENAI_API_KEY",
        system: true,
      },
      {
        project_id: newProject[0].id,
        key: "REPLICATE_API_KEY",
        system: true,
      },
    ]);

    return newProject[0];
  });
};
