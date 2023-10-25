import { test, expect } from "bun:test";
import { OpenAIFunctionCall, PromptTemplate, Start, TextNode } from "../nodes";
import { Editor } from "../editor";
import { waitFor } from "xstate";
import { mockAPI, nodeAreaDefaults } from "./shared";

test("Node registry", async () => {
  const editor = new Editor({
    config: {
      api: mockAPI,
      nodes: { Start, TextNode },
    },
    content: {
      nodes: [],
      edges: [],
    },
  });
});

test("Can not add node which is not registered", async () => {
  expect(() => {
    new Editor({
      config: {
        api: mockAPI,
        nodes: { Start },
      },
      content: {
        nodes: [
          {
            context: {},
            id: "1",
            // @ts-ignore: Test case for an unregistered node type
            type: "TextNode",
          },
        ],
        edges: [],
      },
    });
  }).toThrow();
});

test("Can add node which is registered", async () => {
  const editor = new Editor({
    config: {
      api: mockAPI,
      nodes: { Start, TextNode },
    },
    content: {
      nodes: [
        {
          ...nodeAreaDefaults,
          context: {
            value: "Hello",
            outputs: {},
          },
          id: "1",
          type: "TextNode",
        },
      ],
      edges: [],
    },
  });
});

test("Throw if the edges are not valid", async () => {
  expect(
    () =>
      new Editor({
        config: {
          api: mockAPI,
          nodes: { Start, TextNode },
        },
        content: {
          nodes: [
            {
              ...nodeAreaDefaults,
              context: {},
              id: "1",
              type: "TextNode",
            },
          ],
          edges: [
            {
              id: "1",
              source: "1",
              target: "2",
              sourceOutput: "output",
              targetInput: "input",
            },
          ],
        },
      })
  ).toThrow();
});

test("Can add valid edges", async () => {
  const editor = new Editor({
    config: {
      api: mockAPI,
      nodes: { TextNode, OpenAIFunctionCall },
    },
    content: {
      nodes: [
        TextNode.parse({
          ...nodeAreaDefaults,
          id: "1",
          state: {
            error: undefined,
            value: "complete",
            status: "done",
            output: "Hello",
            context: {
              value: "Holaaa",
              outputs: {
                value: "Holaaa",
              },
            },
            historyValue: {},
            children: {},
          },
          context: {
            value: "Hello",
            outputs: {
              value: "Hello",
            },
          },
        }),
        {
          ...nodeAreaDefaults,
          context: {},
          id: "2",
          type: "OpenAIFunctionCall",
        },
      ],
      edges: [
        {
          id: "1",
          source: "1",
          target: "2",
          sourceOutput: "value",
          targetInput: "prompt",
        },
      ],
    },
  });
});

test("Setups the editor", async () => {
  const di = new Editor({
    config: {
      api: mockAPI,
      nodes: { TextNode, OpenAIFunctionCall },
    },
    content: {
      nodes: [
        TextNode.parse({
          ...nodeAreaDefaults,
          id: "1",
        }),
        OpenAIFunctionCall.parse({
          ...nodeAreaDefaults,
          id: "2",
        }),
      ],
      edges: [
        {
          id: "1",
          source: "1",
          target: "2",
          sourceOutput: "value",
          targetInput: "prompt",
        },
      ],
    },
  });

  await di.setup();

  expect(di.editor.getNodes().length).toBe(2);
  expect(di.editor.getConnections().length).toBe(1);
});

test("Test execution", async () => {
  const di = new Editor({
    config: {
      api: mockAPI,
      nodes: { TextNode, PromptTemplate },
    },
    content: {
      nodes: [
        TextNode.parse({
          ...nodeAreaDefaults,
          id: "1",
          context: {
            value: "Random",
            outputs: {
              value: "Hello",
            },
          },
        }),
        PromptTemplate.parse({
          ...nodeAreaDefaults,
          id: "2",
          context: {
            outputs: {
              value: "",
            },
            settings: {
              template: "What is your name? {{prompt}}",
              variables: ["prompt"],
            },
            inputs: {
              prompt: "hello",
            },
          },
          type: "PromptTemplate",
        }),
      ],
      edges: [
        {
          id: "1",
          source: "1",
          target: "2",
          sourceOutput: "value",
          targetInput: "prompt",
        },
      ],
    },
  });

  await di.setup();

  const promptTemplate = di.editor.getNode("2");
  const textt = di.editor.getNode("1");
  expect(promptTemplate).toBeDefined();
  di.engine.execute(promptTemplate.id);
  await waitFor(promptTemplate.actor, (state) => state.value === "complete");
  const textState = textt.actor.getPersistedState();
  const promptState = promptTemplate.actor.getPersistedState();
  expect(promptState?.value).toBe("complete");
  expect(textState?.value).toBe("complete");
  expect(textState?.context?.outputs?.value).toBe("Random");
  expect(promptState?.context?.outputs?.value).toBe(
    "What is your name? Random"
  );
});
