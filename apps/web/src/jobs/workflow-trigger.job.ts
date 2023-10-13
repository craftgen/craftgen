import { client } from "@/trigger";
import { getWorkflow } from "@/app/(dashboard)/project/[projectSlug]/playground/[playgroundSlug]/action";
import { createHeadlessEditor } from "@/app/(dashboard)/project/[projectSlug]/playground/[playgroundSlug]/[version]/headless";
import { WORKFLOW_TRIGGER } from "./workflow-trigger";
import { eventTrigger } from "@trigger.dev/sdk";
import { waitFor } from "xstate";
import { WORKFLOW_NODE_TRIGGER } from "./workflow-execution-step";
import { z } from "zod";
import { isEqual } from "lodash-es";

client.defineJob({
  id: WORKFLOW_TRIGGER.name,
  name: "Workflow Trigger",
  version: "0.0.1",
  trigger: eventTrigger({
    name: WORKFLOW_TRIGGER.name,
    schema: WORKFLOW_TRIGGER.schema,
  }),
  run: async (payload, io, ctx) => {
    const workflow = await getWorkflow({
      workflowSlug: payload.workflowSlug,
      projectSlug: payload.projectSlug,
      version: payload.version,
      executionId: payload.executionId,
    });

    if (!workflow.data) {
      throw new Error("Workflow not found");
    }
    io.logger.info("Workflow Payload Values", payload.values);

    const di = await createHeadlessEditor(workflow.data);
    const entryNode = di.editor.getNode(payload.workflowNodeId);
    if (!entryNode) {
      throw new Error("Entry node not found");
    }
    io.logger.info("Sending to entry node");
    entryNode.actor.send({
      type: "SET_VALUE",
      values: payload.values,
    });

    await io.runTask("wait for input set", async () => {
      await waitFor(entryNode.actor, (state) =>
        isEqual(state.context.inputs, payload.values)
      );
    });
    await io.sendEvent("workflow.execution.step", {
      name: WORKFLOW_NODE_TRIGGER.name,
      payload: {
        workflowSlug: payload.workflowSlug,
        projectSlug: payload.projectSlug,
        executionId: payload.executionId,
        version: payload.version,
        workflowNodeId: payload.workflowNodeId,
      } as z.infer<typeof WORKFLOW_NODE_TRIGGER.schema>,
    });
  },
});
