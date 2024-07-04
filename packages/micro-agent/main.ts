import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { HumanMessage } from "npm:@langchain/core/messages";
import { DynamicStructuredTool, DynamicTool } from "npm:@langchain/core/tools";
import {
  END,
  MemorySaver,
  START,
  StateGraph,
  StateGraphArgs,
} from "npm:@langchain/langgraph";
import { ToolNode } from "npm:@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "npm:@langchain/openai";
import { z } from "npm:zod";

const env = await load();

// Define the state interface
interface AgentState {
  messages: HumanMessage[];
}

// Define the graph state
const graphState: StateGraphArgs<AgentState>["channels"] = {
  messages: {
    value: (x: HumanMessage[], y: HumanMessage[]) => x.concat(y),
    default: () => [],
  },
};

// Define the tools for the agent to use
const tools = [
  new DynamicTool({
    name: "get-files",
    description: "Get a list of files in the functions directory",
    func: async () => {
      const files = [];
      for await (const dirEntry of Deno.readDir("./functions")) {
        files.push(dirEntry);
      }
      return `
        The following files are available in the functions directory:
        ${files.length === 0 ? "No files found" : ""}
        ${files.map((file) => file.name).join("\n")}
      `;
    },
    verbose: true,
  }),
  new DynamicStructuredTool({
    name: "read-file",
    description: "Reads the code file",
    schema: z.object({
      fileName: z
        .string()
        .describe("The name of the file to read with extension"),
    }),
    func: async ({ fileName }) => {
      return await Deno.readTextFile(`./functions/${fileName}`);
    },
    verbose: true,
  }),
  new DynamicStructuredTool({
    name: "overwrite-the-code",
    description: "overwrites the code file",
    schema: z.object({
      filename: z.string().describe("The name of the file to overwrite"),
      content: z.string(),
    }),
    verbose: true,
    func: async ({ filename, content }) => {
      await Deno.writeTextFile(`./functions/${filename}`, content);
      return "File written successfully";
    },
  }),
  new DynamicStructuredTool({
    name: "run-tests",
    description: "runs the tests",
    verbose: true,
    schema: z.object({
      filename: z
        .string()
        .describe("The name of the file to run the tests for"),
    }),
    func: async ({ filename }) => {
      console.log("RUNNING TESTS FOR FILE", filename);
      const res = Deno.run({
        cmd: ["deno", "test", `functions/${filename}`, "--reload", "--quiet"],
        env: {
          NO_COLOR: "true",
        },
        stderr: "piped",
        stdout: "piped",
      });
      const success = await res.status();
      if (success.success) {
        return `Tests passed
        ---
        ${new TextDecoder().decode(await res.output())}
        `;
      } else {
        return `
        Test failed with the following error:
        ---
        ${new TextDecoder().decode(await res.stderrOutput())}
        `;
      }
    },
  }),
];
const toolNode = new ToolNode<AgentState>(tools);

const model = new ChatOpenAI({
  temperature: 0,
  apiKey: env.OPENAI_API_KEY,
  verbose: true,
  model: "gpt-4o",
}).bindTools(tools);

// Define the function that determines whether to continue or not
function shouldContinue(state: AgentState): "tools" | typeof END {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.additional_kwargs.tool_calls) {
    return "tools";
  }
  // Otherwise, we stop (reply to the user)
  return END;
}

// Define the function that calls the model
async function callModel(state: AgentState) {
  const messages = state.messages;
  const response = await model.invoke(messages);

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// Define a new graph
const workflow = new StateGraph<AgentState>({
  channels: graphState,
})
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

// Initialize memory to persist state between graph runs
const checkpointer = new MemorySaver();

// Finally, we compile it!
// This compiles it into a LangChain Runnable.
// Note that we're (optionally) passing the memory when compiling the graph
const app = workflow.compile({ checkpointer });

// Use the Runnable

async function run(problem?: string) {
  const finalState = await app.invoke(
    {
      messages: [
        new HumanMessage(
          `
    You are a developer who is trying to create a new module.
    create a new module to solve the following problem:
    ${problem}

    --- 
    you're operating in Deno runtime. write your code in Typescript.

    your code should be in the very well tested.
    use assert module to test your code.
    for exp: import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
    The assertions module provides 14 assertions:
        assert(expr: unknown, msg = ""): asserts expr
        assertEquals(actual: unknown, expected: unknown, msg?: string): void
        assertExists(actual: unknown, msg?: string): void
        assertNotEquals(actual: unknown, expected: unknown, msg?: string): void
        assertStrictEquals(actual: unknown, expected: unknown, msg?: string): void
        assertAlmostEquals(actual: number, expected: number, epsilon = 1e-7, msg?: string): void
        assertInstanceOf(actual: unknown, expectedType: unknown, msg?: string): void
        assertStringIncludes(actual: string, expected: string, msg?: string): void
        assertArrayIncludes(actual: unknown[], expected: unknown[], msg?: string): void
        assertMatch(actual: string, expected: RegExp, msg?: string): void
        assertNotMatch(actual: string, expected: RegExp, msg?: string): void
        assertObjectMatch( actual: Record<PropertyKey, unknown>, expected: Record<PropertyKey, unknown>): void
        assertThrows(fn: () => void, ErrorClass?: Constructor, msgIncludes?: string | undefined, msg?: string | undefined): Error
        assertRejects(fn: () => Promise<unknown>, ErrorClass?: Constructor, msgIncludes?: string | undefined, msg?: string | undefined): Promise<void>
    include tests in Deno.test block. 

    Your business logic and tests should be in the same file.
    Use given tools to read, write and run tests.

    Example of a valid module:
    ---
    /** 
     * Function for adding two numbers together. 
     * examples: 
     * const sum = add(2, 5)
     * // sum = 7
     *  
    function add(a: number, b: number): number {
      return a + b;
    } 

Deno.test({
  name: "can add two numbers",
  fn: () => {
    assertEquals(add(1, 2), 3);
  },
});


---


    `,
        ),
      ],
    },
    { configurable: { thread_id: "42" } },
  );
  console.log(finalState.messages[finalState.messages.length - 1].content);
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const requestt = prompt(
    "What you wanna do?",
    "create a module for turning csv data to markdown table.",
  );
  if (requestt) {
    await run(requestt);
  }
}
