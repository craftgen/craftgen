import { format } from "date-fns";
import { google } from "googleapis";
import { z } from "zod";

import { createTRPCRouter, googleAuthProducer } from "../../../trpc";

export const searchConsoleRouter = createTRPCRouter({
  query: googleAuthProducer
    .input(
      z.object({
        siteUrl: z.string(),
        requestBody: z.object({
          startDate: z.date().transform((v) => format(v, "yyyy-MM-dd")),
          endDate: z.date().transform((v) => format(v, "yyyy-MM-dd")),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      console.log("RUNNING", { input, ctx });
      const webmaster = google.webmasters({
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
