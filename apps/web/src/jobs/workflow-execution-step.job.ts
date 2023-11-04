import { eventTrigger } from "@trigger.dev/sdk";

import { getWorkflow } from "@/actions/get-workflow";
import { client } from "@/trigger";

import { WORKFLOW_NODE_TRIGGER } from "./workflow-execution-step";

client.defineJob({
  id: WORKFLOW_NODE_TRIGGER.name,
  name: "Workflow Execution Step",
  version: "0.0.1",
  trigger: eventTrigger({
    name: WORKFLOW_NODE_TRIGGER.name,
    schema: WORKFLOW_NODE_TRIGGER.schema,
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
    io.logger.info("Workflow", workflow.data);

    // const di = await createHeadlessEditor(workflow.data, { logger: io.logger });
    // const entryNode = di.editor.getNode(payload.workflowNodeId);
    // if (!entryNode) {
    //   throw new Error("Entry node not found");
    // }
    // let state = entryNode.actor.getSnapshot();
    // new Promise((resolve, reject) => {
    //   entryNode.actor.subscribe({
    //     error(err) {
    //       reject(err);
    //     },
    //     next: (data) => {
    //       io.logger.info("STATE", data);
    //       state = data;
    //     },
    //     complete: () => {
    //       resolve(state);
    //       io.logger.log("COMPLETE", state.output);
    //     },
    //   });
    // });
    // di.engine.execute(entryNode.id, undefined, payload.executionId);
    // await waitFor(entryNode.actor, (state) => state.matches("complete"), {
    //   timeout: 1000 * 60 * 5,
    // });
    // io.logger.info("STATE", state);
  },
});
