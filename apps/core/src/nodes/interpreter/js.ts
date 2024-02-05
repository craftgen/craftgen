import dedent from "ts-dedent";
import {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  BaseNode,
  None,
} from "../base";
import { createMachine, enqueueActions, fromPromise } from "xstate";
import { DiContainer } from "../../types";
import { merge } from "lodash-es";
import { generateSocket } from "../../controls/socket-generator";
import { WorkerMessenger } from "../../worker/messenger";
import { start } from "../../worker/main";

const inputSockets = {
  code: generateSocket({
    "x-key": "code",
    name: "Code" as const,
    title: "Code",
    type: "string" as const,
    default: "async () => {\n  return 42\n}",
    description: "the code",
    required: true,
  }),
  run: generateSocket({
    "x-key": "run",
    name: "run" as const,
    title: "Run",
    type: "trigger" as const,
    default: false,
    "x-event": "RUN",
    description: "Run the Javascript code",
    required: true,
  }),
};
const outputSockets = {
  result: generateSocket({
    "x-key": "result",
    name: "result" as const,
    title: "Result",
    type: "object" as const,
    description: "The result of the Javascript code",
    required: true,
  }),
};

type JavascriptCodeInterpreterInput = {
  // worker: WorkerMessenger;
  code: string;
};

const executeJavascriptCode = fromPromise(
  async ({ input }: { input: JavascriptCodeInterpreterInput }) => {
    const worker = start();
    const result = await worker.postoffice.sendScript(input.code, []);
    return result;
  },
);

export const JavascriptCodeInterpreterMachine = createMachine(
  {
    id: "javascript-code-interpreter",
    context: ({ input }) => {
      const defaultInputs: (typeof input)["inputs"] = {};
      for (const [key, socket] of Object.entries(inputSockets)) {
        const inputKey = key as keyof typeof inputSockets;
        if (socket.default) {
          defaultInputs[inputKey] = socket.default as any;
        } else {
          defaultInputs[inputKey] = undefined;
        }
      }
      // const worker = start();
      // console.log("@".repeat(200), worker);
      return merge<typeof input, any>(
        {
          inputs: {
            ...defaultInputs,
          },
          outputs: {
            result: {},
          },
          inputSockets: {
            ...inputSockets,
          },
          outputSockets: {
            ...outputSockets,
          },
        },
        input,
      );
    },
    // always: {
    //   guard: ({ context }) => isNil(context.worker),
    //   actions: enqueueActions(({ enqueue }) => {
    //     console.log("WORKER", start);
    //     enqueue.assign({
    //       worker: start(),
    //     });
    //   }),
    // },
    types: {} as BaseMachineTypes<{
      input: BaseInputType<typeof inputSockets, typeof outputSockets> & {
        worker?: WorkerMessenger;
      };
      context: BaseContextType<typeof inputSockets, typeof outputSockets> & {
        worker?: WorkerMessenger;
      };
      actions: None;
      events: None;
      actors: None;
      guards: None;
    }>,
    initial: "idle",
    states: {
      idle: {
        on: {
          RUN: {
            target: "run",
            // actions: enqueueActions(({ enqueue, context }) => {
            //   enqueue.spawnChild("executeJavascriptCode", {
            //     input: {
            //       worker: worker,
            //       code: context.inputs.code,
            //     },
            //   });
            // }),
          },
        },
      },
      run: {
        invoke: {
          src: "executeJavascriptCode",
          input: ({ context }) => {
            // const worker = start();
            return {
              // worker: worker,
              code: context.inputs.code,
            };
          },
          onDone: {
            target: "idle",
            actions: enqueueActions(({ enqueue, event }) => {
              console.log("RESSS", event);
              enqueue.assign({
                outputs: {
                  result: event.output,
                },
              });
            }),
          },
          onError: {
            target: "idle",
            actions: enqueueActions(({ enqueue, event }) => {
              console.error(event);
            }),
          },
        },
      },
    },
  },
  {
    actors: {
      executeJavascriptCode,
    },
  },
);

export class NodeJavascriptCodeInterpreter extends BaseNode<
  typeof JavascriptCodeInterpreterMachine
> {
  static title = "Javascript";
  static label = "Javascript";
  static description = dedent`
    A node that can execute Javascript code.
  `;
  static icon = "code";

  static machines = {
    NodeJavascriptCodeInterpreter: JavascriptCodeInterpreterMachine,
  };

  constructor(di: DiContainer, data: any) {
    super(
      "NodeJavascriptCodeInterpreter",
      di,
      data,
      JavascriptCodeInterpreterMachine,
      {},
    );
    this.setup();
  }
}
