"use server";

import { db } from "@craftgen/db/db";

export const getWorkflowById = async (workflowId: string) => {
  return await db.query.workflow.findFirst({
    where: (workflow, { eq }) => eq(workflow.id, workflowId),
    with: {
      nodes: {
        with: {
          context: {
            columns: {
              state: true,
            },
          },
        },
      },
      edges: true,
    },
  });
};
