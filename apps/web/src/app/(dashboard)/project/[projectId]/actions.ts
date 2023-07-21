"use server";

import { getGoogleAuth, getWebmaster } from "@/lib/google";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { db } from "@turboseo/supabase/db";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { format, sub } from "date-fns";

export const getProject = async (projectSlug: string) => {
  return await db.query.project.findFirst({
    where: (project, { eq }) => eq(project.slug, projectSlug),
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
      startDate: format(sub(new Date(), { days: 10 }), 'yyyy-MM-dd'),
      endDate: format(sub(new Date(), { days: 3 }), 'yyyy-MM-dd'),
    }
  });
  return res.data
};
