import { merge } from "lodash-es";
import type { SetOptional } from "type-fest";
import { assign, createMachine } from "xstate";

import { SelectControl } from "../../controls/select";
import type { JSONSocket } from "../../controls/socket-generator";
import { EditorMachine, type Editor } from "../../editor";
import type { DiContainer } from "../../types";
import { BaseNode, type BaseMachineTypes, type ParsedNode } from "../base";

// const ModuleNodeMachine = createMachine({
//   /** @xstate-layout N4IgpgJg5mDOIC5QFkD2ECuAbMA5dYAdAJYQ4DEAygKIAqA+sgPIAiAqgDLUDaADALqJQAB1SxiAF2KoAdkJAAPRAFoAbIQCsAZg0BGDaoBMGgDQgAnokO8A7IQAshgJyr7qgBy8n7pxvf2AXwCzNEwcfAgiAGNZGTAoiUgqOkZWTh4BeVFxKVl5JQR9XUJed2stXWMzS0KtdRteCuMgkPRsPAJCGJk4hKSaBgBhJlwAMQBJAHE+QSQQbMlpOTmC-XtCVVdeI1MLRHteQmbgkFD2iOjY+MSIcgAlNlwZrLFFvJWrJycN9xtdmsM9g0hH0Rl0TnsZUcunc7iCJxkBHgczO4QILxyS3yKl0WncJR0oKqewQynsdmOrTCHUiJDIYAxb2WoAKyich0aegMxIBWkO7KMXj53l8vxapzaaNp3V6N0ZuWZikQulcJScWj+1SseJB3PBkMBhhhcJOqJpRAAThgesQZFB5ViPgh7OCfpqSYYtN8ifqoUbYfCAkA */
//   id: "ModuleNode",
//   context: ({ input }) =>
//     merge(
//       {
//         moduleId: undefined,
//         inputId: undefined,
//         inputs: {},
//         outputs: {},
//         outputSockets: {},
//         inputSockets: {},
//         error: null,
//       },
//       input,
//     ),
//   types: {} as BaseMachineTypes<{
//     input: {
//       moduleId: string;
//       inputId?: string;
//     };
//     actions: {
//       type: "setInput";
//       params?: {
//         inputId: string;
//       };
//     };
//     context: {
//       moduleId: string;
//       inputId?: string;
//       inputs: Record<string, any>;
//       outputs: Record<string, any>;
//       inputData: Record<string, any>;
//       outputData: Record<string, any>;
//       error: {
//         name: string;
//         message: string;
//       } | null;
//     };
//     actors: any;
//     events:
//       | {
//           type: "SET_MODULE";
//           moduleId: string;
//         }
//       | {
//           type: "SET_INPUT";
//           inputId: string;
//         }
//       | {
//           type: "SET_CONFIG";
//           inputSockets: Record<string, JSONSocket>;
//           outputSockets: Record<string, JSONSocket>;
//         }
//       | {
//           type: "RUN";
//           inputData: Record<string, any>;
//         };
//   }>,

//   initial: "idle",
//   states: {
//     idle: {
//       on: {
//         SET_INPUT: {
//           actions: assign({
//             inputId: ({ event }) => event.inputId,
//           }),
//         },
//         SET_CONFIG: {
//           actions: assign({
//             inputSockets: ({ event }) => event.inputSockets,
//             outputSockets: ({ event }) => event.outputSockets,
//           }),
//         },
//         SET_VALUE: {
//           actions: ["setValue", "removeError"],
//         },
//         RUN: {
//           target: "running",
//           actions: ["setValue", "removeError"],
//         },
//       },
//     },
//     running: {
//       invoke: {
//         src: "execute",
//         input: ({ context }) => ({
//           inputId: context.inputId,
//           inputData: context.inputs,
//         }),
//         onDone: {
//           target: "complete",
//           actions: assign({
//             outputs: ({ event }) => event.output,
//           }),
//         },
//         onError: {
//           target: "error",
//           actions: assign({
//             error: ({ event }) => ({
//               name: (event.data as Error).name,
//               message: (event.data as Error).message,
//             }),
//           }),
//         },
//       },
//     },
//     error: {
//       on: {
//         RUN: {
//           target: "running",
//           actions: ["setValue", "removeError"],
//         },
//       },
//     },
//     complete: {},
//   },
// });

export type NodeModuleData = ParsedNode<"NodeModule", typeof EditorMachine>;

export class NodeModule extends BaseNode<typeof EditorMachine> {
  static nodeType = "NodeModule" as const;
  static label = "Module";
  static description = "Node for handling module nodes";
  static icon = "component";

  static parse(params: SetOptional<NodeModuleData, "type">): NodeModuleData {
    return {
      ...params,
      type: "NodeModule",
    };
  }

  static machines = {
    // NodeModule: EditorMachine,
  };

  constructor(di: DiContainer, data: NodeModuleData) {
    super("NodeModule", di, data, EditorMachine, {});

    // const state = this.actor.getSnapshot();

    // this.setModule(state.context.moduleId);

    // reaction(
    //   () => this.snap.context.moduleId,
    //   async () => {
    //     console.log("MODULE ID ");
    //     if (!this.snap.context.moduleId) return;
    //     await this.setModule(this.snap.context.moduleId);
    //   },
    // );
  }
  // async setModule(moduleId: string) {
  //   this.module = await this.di.createEditor(moduleId);
  //   this.setupActor(this.module.actor!);
  //   this.actor = this.module.actor!;
  // }
}
