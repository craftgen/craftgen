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

    const di = await createHeadlessEditor(workflow.data, { logger: io.logger });
    const entryNode = di.editor.getNode(payload.workflowNodeId);
    if (!entryNode) {
      throw new Error("Entry node not found");
    }

    // io.logger.info("ENTRY NODE", entryNode);

    // entryNode.actor.subscribe((state) => {
    //   io.logger.info("STATE", state);
    // });
    entryNode.actor.send({
      type: "SET_VALUE",
      values: payload.values,
    });
    await waitFor(entryNode.actor, (state) =>
      isEqual(state.context.inputs, payload.values)
    );
    await entryNode.saveState({ state: entryNode.actor.getSnapshot() });

    io.runTask(
      `execute-${entryNode.ID}-${entryNode.id}-${payload.executionId}`,
      async () => {
        let state = entryNode.actor.getSnapshot();
        entryNode.actor.subscribe({
          next: (data) => {
            io.logger.info("STATE", data);
            state = data;
          },
          complete: () => {
            io.logger.log("COMPLETE", state.output);
          },
        });
        di.engine.execute(entryNode.id, undefined, payload.executionId);
        await waitFor(entryNode.actor, (state) => state.matches("complete"), {
          timeout: 1000 * 60 * 5,
        });
        io.logger.info("STATE", state);
      }
    );

    // await io.sendEvent("workflow.execution.step-input", {
    //   name: WORKFLOW_NODE_TRIGGER.name,
    //   payload: {
    //     workflowSlug: payload.workflowSlug,
    //     projectSlug: payload.projectSlug,
    //     executionId: payload.executionId,
    //     version: payload.version,
    //     workflowNodeId: payload.workflowNodeId,
    //   } as z.infer<typeof WORKFLOW_NODE_TRIGGER.schema>,
    // });

    // io.runTask(
    //   "wait for entry node to complete",
    //   async () => {
    //     await waitFor(entryNode.actor, (state) => state.matches("completed"), {
    //       timeout: 60 * 1000,
    //     });
    //   },
    //   {
    //     retry: {
    //       limit: 10,
    //     },
    //   }
    // );

    // await waitFor(entryNode.actor, (state) => state.matches("completed"), {
    //   timeout: 30 * 1000,
    // });
    // await io.runTask("wait for input set", async () => {
    // io.logger.debug("entryNode.actor", entryNode.actor.getSnapshot());
    // entryNode.actor.subscribe({
    //   error(err) {
    //     io.logger.error("STATE ERROR", err as any);
    //   },
    //   next: (data) => {
    //     io.logger.info("STATE NEXT", data);
    //   },
    //   complete: () => {
    //     io.logger.log("COMPLETE", entryNode.actor.getSnapshot());
    //   },
    // });
    // entryNode.actor.send({
    //   type: "RUN",
    //   inputs: payload.values,
    // });
    // await waitFor(entryNode.actor, (state) => state.matches("completed"), {
    //   timeout: 10000,
    // });
    // });
  },
});
