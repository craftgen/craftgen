import { webmasters } from "@googleapis/webmasters";
import { format, parseISO } from "date-fns";
import { z } from "zod";

import { createTRPCRouter, googleAuthProducer } from "../../../trpc";

export const normalizeUrl = (url: string) => {
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  if (url.startsWith("sc-domain:")) {
    return url.replace("sc-domain:", "");
  }

  return url;
};

export const searchConsoleRouter = createTRPCRouter({
  sites: googleAuthProducer.query(async ({ ctx }) => {
    const webmaster = webmasters({
      version: "v3",
      auth: ctx.googleAuth,
    });
    const sites = await webmaster.sites.list();
    return (
      sites.data.siteEntry?.map((site) => ({
        url: normalizeUrl(site.siteUrl!),
        ...site,
      })) || []
    );
  }),
  query: googleAuthProducer
    .input(
      z.object({
        siteUrl: z.string(),
        requestBody: z.object({
          startDate: z
            .string()
            .transform((v) => format(parseISO(v), "yyyy-MM-dd")),
          endDate: z
            .string()
            .transform((v) => format(parseISO(v), "yyyy-MM-dd")),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const webmaster = webmasters({
        version: "v3",
        auth: ctx.googleAuth,
      });
      const res = await webmaster.searchanalytics.query({
        siteUrl: input.siteUrl,
        requestBody: {
          startDate: input.requestBody.startDate,
          endDate: input.requestBody.endDate,
          dimensionFilterGroups: [
            {
              filters: [
                {
                  dimension: "PAGE",
                  operator: "equals",
                  expression:
                    "https://www.ailifestory.com/blog/recording-your-life-story",
                },
              ],
            },
          ],
          dimensions: ["query"],
          aggregationType: "AUTO",
        },
      });
      return res.data;
    }),
});
