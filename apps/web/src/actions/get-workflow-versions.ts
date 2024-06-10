"use server";

import { z } from "zod";

import { db } from "@craftgen/db/db";

import { action } from "@/lib/safe-action";

export const getWorkflowVersions = action(
  z.object({
    projectSlug: z.string(),
    workflowSlug: z.string(),
  }),
  async (params) => {
    return await db.transaction(async (tx) => {
      return await tx.query.workflow.findFirst({
        where: (workflow, { eq, and }) =>
          and(
            eq(workflow.slug, params.workflowSlug),
            eq(workflow.projectSlug, params.projectSlug),
          ),
        columns: {
          id: true,
          slug: true,
          projectSlug: true,
        },
        with: {
          versions: {
            // where: (workflowVersion, { eq, and, isNotNull }) =>
            //   and(isNotNull(workflowVersion.publishedAt)),
            orderBy: (workflowVersion, { desc }) => [
              desc(workflowVersion.version),
            ],
          },
        },
      });
    });
  },
);

export const getWorkflowVersionsById = action(
  z.object({
    workflowId: z.string(),
  }),
  async (params) => {
    return await db.transaction(async (tx) => {
      return await tx.query.workflowVersion.findMany({
        where: (workflowVersion, { eq, and }) =>
          eq(workflowVersion.workflowId, params.workflowId),
        with: {
          workflow: true,
        },
      });
    });
  },
);
