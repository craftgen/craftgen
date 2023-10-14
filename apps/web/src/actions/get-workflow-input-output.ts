import { action } from "@/lib/safe-action";
import { db } from "@seocraft/supabase/db";
import { z } from "zod";

export const getWorkflowInputOutput = action(
  z.object({
    workflowSlug: z.string(),
    projectSlug: z.string(),
    version: z.number(),
  }),
  async (params) => {
    return await db.transaction(async (tx) => {
      const workflow = await tx.query.workflow.findFirst({
        where: (workflow, { eq, and }) =>
          and(
            eq(workflow.slug, params.workflowSlug),
            eq(workflow.projectSlug, params.projectSlug)
          ),
        with: {
          versions: {
            where: (workflowVersion, { eq }) =>
              eq(workflowVersion.version, params.version),
            with: {
              nodes: {
                where: (workflowNode, { eq, or }) =>
                  or(
                    eq(workflowNode.type, "InputNode"),
                    eq(workflowNode.type, "OutputNode")
                  ),
                with: {
                  context: {
                    columns: {
                      state: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      const inputs = workflow?.versions[0]?.nodes.filter(
        (node) => node.type === "InputNode"
      );
      const outputs = workflow?.versions[0]?.nodes.filter(
        (node) => node.type === "OutputNode"
      );
      return {
        inputs,
        outputs,
      };
    });
  }
);
