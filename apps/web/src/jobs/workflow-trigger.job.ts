import { eventTrigger } from "@trigger.dev/sdk";

import { getWorkflow } from "@/actions/get-workflow";
import { client } from "@/trigger";

import { WORKFLOW_TRIGGER } from "./workflow-trigger";

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
    // const di = await createHeadlessEditor(workflow.data, { logger: io.logger });
    // const entryNode = di.editor.getNode(payload.workflowNodeId);
    // if (!entryNode) {
    //   throw new Error("Entry node not found");
    // }

    // // io.logger.info("ENTRY NODE", entryNode);

    // // entryNode.actor.subscribe((state) => {
    // //   io.logger.info("STATE", state);
    // // });
    // entryNode.actor.send({
    //   type: "SET_VALUE",
    //   values: payload.values,
    // });
    // await waitFor(entryNode.actor, (state) =>
    //   isEqual(state.context.inputs, payload.values)
    // );
    // await entryNode.saveState({ state: entryNode.actor.getPersistedState()! });

    // io.runTask(
    //   `execute-${entryNode.ID}-${entryNode.id}-${payload.executionId}`,
    //   async () => {
    //     let state = entryNode.actor.getSnapshot();
    //     entryNode.actor.subscribe({
    //       next: (data) => {
    //         io.logger.info("STATE", data);
    //         state = data;
    //       },
    //       complete: () => {
    //         io.logger.log("COMPLETE", state.output);
    //       },
    //     });
    //     di.engine.execute(entryNode.id, undefined, payload.executionId);
    //     await waitFor(entryNode.actor, (state) => state.matches("complete"), {
    //       timeout: 1000 * 60 * 5,
    //     });
    //     io.logger.info("STATE", state);
    //   }
    // );
  },
});
