"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { google } from "googleapis";
import { normalizeUrl } from "./shared";
import { db, project, projectMembers } from "@turboseo/supabase/db";
import { z } from "zod";
import { newProjectSchema } from "./shared";
import { getGoogleAuth } from "@/lib/google";

export const getSites = async () => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();
  const googleAuth = await getGoogleAuth({session: session.data.session!});

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
  params: z.infer<typeof newProjectSchema>
) => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();
  await db.transaction(async (tx) => {
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
  });
};
