"use server";

import { getGoogleAuth, getWebmaster } from "@/lib/google";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { db, playground } from "@turboseo/supabase/db";
import { cookies } from "next/headers";
import { format, sub } from "date-fns";

export const getProject = async (projectSlug: string) => {
  return await db.query.project.findFirst({
    where: (project, { eq }) => eq(project.slug, projectSlug),
  });
};

export const createPlayground = async ({
  project_id,
}: {
  project_id: string;
}) => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();
  
  const newPlayground = await db
    .insert(playground)
    .values({
      name: "New Playground",
      project_id,
      edges: [],
      nodes: [],
    })
    .returning();
    return newPlayground[0]
};

export const getPlaygrounds = async (projectId: string) => {
  console.log('PROEJCT>', projectId)
  return await db.query.playground.findMany({
    where: (playground, { eq }) => eq(playground.project_id, projectId),
  });
};

export const getSomething = async ({ siteUrl }: { siteUrl: string }) => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();
  const webmaster = await getWebmaster({ session: session.data.session! });

  const res = await webmaster.searchanalytics.query({
    siteUrl,
    requestBody: {
      dimensions: ["date"],
      startDate: format(sub(new Date(), { days: 10 }), "yyyy-MM-dd"),
      endDate: format(sub(new Date(), { days: 3 }), "yyyy-MM-dd"),
    },
  });
  return res.data;
};
