import { expect, mock, spyOn, test } from "bun:test";

import { Editor } from "../editor";
import { InputNode, OutputNode, PromptTemplate } from "../nodes";
import { mockAPI, nodeAreaDefaults } from "./shared";

test("Setup Input outputs", async () => {
  const di = new Editor({
    config: {
      api: mockAPI,
      nodes: { InputNode, PromptTemplate, OutputNode },
      meta: {
        projectId: "projectId",
        workflowId: "workflowId",
        workflowVersionId: "workflowVersionId",
      },
    },
    content: {
      nodes: [
        InputNode.parse({
          ...nodeAreaDefaults,
          executionId: "executionId",
          // executionNodeId
          context: {
            name: "Input Prompt",
            description: "Prompt",
            inputs: {
              title: "",
            },
            inputSockets: {
              title: {
                name: "title",
                type: "string",
                required: true,
                isMultiple: false,
              },
            },
            outputs: {
              title: "",
            },
            outputSockets: {
              title: {
                name: "title",
                type: "string",
                required: true,
                isMultiple: true,
              },
            },
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
            inputSockets: {
              title: {
                name: "title",
                type: "string",
                required: true,
                isMultiple: false,
              },
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
            inputSockets: {
              value: {
                name: "value",
                type: "string",
                required: true,
                isMultiple: false,
              },
            },
            inputs: {},
            outputs: {},
            outputSockets: {
              value: {
                name: "value",
                type: "string",
                required: true,
                isMultiple: true,
              },
            },
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
  expect(inputNode.inputs.title).toBeDefined();

  const promptTemplate = di.editor.getNode("node_promptTemplate");
  expect(promptTemplate).toBeDefined();
  expect(promptTemplate.inputs.title?.label).toBe("title");

  const outputNode = di.editor.getNode("node_outputNode");
  expect(outputNode).toBeDefined();
  expect(outputNode.inputs.value?.label).toBe("value");

  // await di.run({
  //   inputId: "node_Input",
  //   inputs: {
  //     title: "Hello",
  //   },
  // });

  expect(inputNode.snap.status).toBe("done");
  expect(promptTemplate.snap.status).toBe("done");
  expect(outputNode.snap.status).toBe("done");
});
test("Check out persistence", async () => {
  const di = new Editor({
    config: {
      api: mockAPI,
      nodes: { InputNode, PromptTemplate, OutputNode },
      meta: {
        projectId: "projectId",
        workflowId: "workflowId",
        workflowVersionId: "workflowVersionId",
      },
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
            inputSockets: {
              title: {
                name: "title",
                type: "string",
                required: true,
                isMultiple: false,
              },
            },
            outputs: {
              title: "",
            },
            outputSockets: {
              title: {
                name: "title",
                type: "string",
                required: true,
                isMultiple: true,
              },
            },
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
            inputSockets: {
              title: {
                name: "title",
                type: "string",
                required: true,
                isMultiple: false,
              },
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
            outputSockets: {
              value: {
                name: "value",
                type: "string",
                required: true,
                isMultiple: true,
              },
            },
            inputSockets: {
              value: {
                name: "value",
                type: "string",
                required: true,
                isMultiple: false,
              },
            },
            inputs: {},
            outputs: {},
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
  let executionStepStartCount = 0;
  const res = await new Promise((resolve, reject) => {
    di.engine.addPipe((context) => {
      // console.log("@@@ Engine context", context.type, context.data.payload.ID);

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
  expect(mockAPI.setState).toHaveBeenCalled();
  expect(mockAPI.setState).toHaveBeenCalledTimes(5);
});
