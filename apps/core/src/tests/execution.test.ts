import { test, expect, mock, spyOn } from "bun:test";
import { Editor } from "../editor";
import { InputNode, OutputNode, PromptTemplate } from "../nodes";
import { mockAPI, nodeAreaDefaults } from "./shared";
import { createJsonSchema } from "../utils";
import { ActorStatus } from "xstate";

test("Setup Input outputs", async () => {
  const di = new Editor({
    config: {
      api: mockAPI,
      nodes: { InputNode, PromptTemplate, OutputNode },
    },
    content: {
      nodes: [
        InputNode.parse({
          ...nodeAreaDefaults,
          executionId: "executionId",
          // executionNodeId
          context: {
            name: "Prompt",
            description: "Prompt",
            inputs: {},
            schema: createJsonSchema([
              {
                name: "title",
                type: "string",
                required: true,
              },
            ]), // Not really
            outputs: {
              title: "",
            },
            outputSockets: [
              {
                name: "title",
                type: "string",
                required: true,
              },
            ],
          },
          id: "node_Input",
        }),
        PromptTemplate.parse({
          ...nodeAreaDefaults,
          executionId: "executionId",
          context: {
            outputs: {
              value: "",
            },
            settings: {
              template: "Create a article for {{title}}",
              variables: ["title"],
            },
            inputs: {
              title: "",
            },
          },
          id: "node_promptTemplate",
        }),
        OutputNode.parse({
          ...nodeAreaDefaults,
          executionId: "executionId",
          context: {
            name: "Output",
            description: "",
            inputSockets: [
              {
                name: "value",
                type: "string",
                required: true,
              },
            ],
            inputs: {},
            outputs: {},
            schema: createJsonSchema([
              {
                name: "value",
                type: "string",
                required: true,
              },
            ]),
          },
          id: "node_outputNode",
        }),
      ],
      edges: [
        {
          id: "node_Input",
          source: "node_Input",
          target: "node_promptTemplate",
          sourceOutput: "title",
          targetInput: "title",
        },
        {
          id: "node_promptTemplate",
          source: "node_Input",
          target: "node_promptTemplate",
          sourceOutput: "trigger",
          targetInput: "trigger",
        },
        {
          id: "node_promptTemplate",
          source: "node_promptTemplate",
          target: "node_outputNode",
          sourceOutput: "trigger",
          targetInput: "trigger",
        },
        {
          id: "node_promptTemplate",
          source: "node_promptTemplate",
          target: "node_outputNode",
          sourceOutput: "value",
          targetInput: "value",
        },
      ],
    },
  });

  await di.setup();
  expect(di.editor.getNodes().length).toBe(3);
  expect(di.editor.getConnections().length).toBe(4);

  const inputNode = di.editor.getNode("node_Input");
  expect(inputNode).toBeDefined();
  expect(inputNode.outputs.title?.label).toBe("title");

  const promptTemplate = di.editor.getNode("node_promptTemplate");
  expect(promptTemplate).toBeDefined();
  expect(promptTemplate.inputs.title?.label).toBe("title");

  const outputNode = di.editor.getNode("node_outputNode");
  expect(outputNode).toBeDefined();
  expect(outputNode.inputs.value?.label).toBe("value");

  inputNode.actor.send({
    type: "SET_VALUE",
    values: {
      title: "Hello",
    },
  });

  di.engine.execute(inputNode.id);
  const res = await new Promise((resolve, reject) => {
    di.engine.addPipe((context) => {
      console.log("@@@ Engine context", context.type, context.data.payload.ID);
      if (context.type === "execution-completed") {
        resolve(context);
      }
      if (context.type === "execution-failed") {
        reject(context);
      }
      return context;
    });
  });
  expect(inputNode.actor.status).toBe(ActorStatus.Stopped);
  expect(promptTemplate.actor.status).toBe(ActorStatus.Stopped);
  expect(outputNode.actor.status).toBe(ActorStatus.Stopped);
});
test("Check out persistence", async () => {
  const di = new Editor({
    config: {
      api: mockAPI,
      nodes: { InputNode, PromptTemplate, OutputNode },
    },
    content: {
      nodes: [
        InputNode.parse({
          ...nodeAreaDefaults,
          executionId: "executionId",
          executionNodeId: "state_Input",
          context: {
            name: "Prompt",
            description: "Prompt",
            inputs: {},
            schema: createJsonSchema([
              {
                name: "title",
                type: "string",
                required: true,
              },
            ]), // Not really
            outputs: {
              title: "",
            },
            outputSockets: [
              {
                name: "title",
                type: "string",
                required: true,
              },
            ],
          },
          id: "node_Input",
        }),
        PromptTemplate.parse({
          ...nodeAreaDefaults,
          executionId: "executionId",
          executionNodeId: "state_promptTemplate",

          context: {
            outputs: {
              value: "",
            },
            settings: {
              template: "Create a article for {{title}}",
              variables: ["title"],
            },
            inputs: {
              title: "",
            },
          },
          id: "node_promptTemplate",
        }),
        OutputNode.parse({
          ...nodeAreaDefaults,
          executionId: "executionId",
          executionNodeId: "state_outputNode",
          context: {
            name: "Output",
            description: "",
            inputSockets: [
              {
                name: "value",
                type: "string",
                required: true,
              },
            ],
            inputs: {},
            outputs: {},
            schema: createJsonSchema([
              {
                name: "value",
                type: "string",
                required: true,
              },
            ]),
          },
          id: "node_outputNode",
        }),
      ],
      edges: [
        {
          id: "node_Input",
          source: "node_Input",
          target: "node_promptTemplate",
          sourceOutput: "title",
          targetInput: "title",
        },
        {
          id: "node_promptTemplate",
          source: "node_Input",
          target: "node_promptTemplate",
          sourceOutput: "trigger",
          targetInput: "trigger",
        },
        {
          id: "node_promptTemplate",
          source: "node_promptTemplate",
          target: "node_outputNode",
          sourceOutput: "trigger",
          targetInput: "trigger",
        },
        {
          id: "node_promptTemplate",
          source: "node_promptTemplate",
          target: "node_outputNode",
          sourceOutput: "value",
          targetInput: "value",
        },
      ],
    },
  });

  await di.setup();
  di.engine.execute("node_Input");
  let count = 0;
  let executionStepStartCount = 0;
  const res = await new Promise((resolve, reject) => {
    di.engine.addPipe((context) => {
      console.log("@@@ Engine context", context.type, context.data.payload.ID);

      if (context.type === "execution-step-start") {
        executionStepStartCount++;
      }

      if (context.type === "execution-completed") {
        resolve(context);
      }
      if (context.type === "execution-failed") {
        reject(context);
      }
      return context;
    });
  });

  expect(executionStepStartCount).toBe(3);
  expect(mockAPI.updateExecutionNode).toHaveBeenCalled();
  expect(mockAPI.updateExecutionNode).toHaveBeenCalledTimes(14);
});
