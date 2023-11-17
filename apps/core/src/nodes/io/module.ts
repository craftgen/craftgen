import { merge } from "lodash-es";
import { action, makeObservable, observable, reaction } from "mobx";
import { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise, type StateFrom } from "xstate";

import { SelectControl } from "../../controls/select";
import { JSONSocket } from "../../controls/socket-generator";
import { Editor } from "../../editor";
import { Input, Output } from "../../input-output";
import { objectSocket, triggerSocket } from "../../sockets";
import type { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, type ParsedNode } from "../base";

const ModuleNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QFkD2ECuAbMA5dYAdAJYQ4DEAygKIAqA+sgPIAiAqgDLUDaADALqJQAB1SxiAF2KoAdkJAAPRAFoAbIQCsAZg0BGDaoBMGgDQgAnokO8A7IQAshgJyr7qgBy8n7pxvf2AXwCzNEwcfAgiAGNZGTAoiUgqOkZWTh4BeVFxKVl5JQR9XUJed2stXWMzS0KtdRteCuMgkPRsPAJCGJk4hKSaBgBhJlwAMQBJAHE+QSQQbMlpOTmC-XtCVVdeI1MLRHteQmbgkFD2iOjY+MSIcgAlNlwZrLFFvJWrJycN9xtdmsM9g0hH0Rl0TnsZUcunc7iCJxkBHgczO4QILxyS3yKl0WncJR0oKqewQynsdmOrTCHUiJDIYAxb2WoAKyich0aegMxIBWkO7KMXj53l8vxapzaaNp3V6N0ZuWZikQulcJScWj+1SseJB3PBkMBhhhcJOqJpRAAThgesQZFB5ViPgh7OCfpqSYYtN8ifqoUbYfCAkA */
  id: "ModuleNode",
  context: ({ input }) =>
    merge(
      {
        moduleId: undefined,
        inputId: undefined,
        inputs: {},
        outputs: {},
        outputSockets: [],
        inputSockets: [],
        error: null,
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      moduleId: string;
      inputId?: string;
    };
    actions: {
      type: "setInput";
      params?: {
        inputId: string;
      };
    };
    context: {
      moduleId: string;
      inputId?: string;
      inputs: Record<string, any>;
      outputs: Record<string, any>;
      inputData: Record<string, any>;
      outputData: Record<string, any>;
      error: {
        name: string;
        message: string;
      } | null;
    };
    actors: any;
    events:
      | {
          type: "SET_MODULE";
          moduleId: string;
        }
      | {
          type: "SET_INPUT";
          inputId: string;
        }
      | {
          type: "SET_CONFIG";
          inputSockets: JSONSocket[];
          outputSockets: JSONSocket[];
        }
      | {
          type: "RUN";
          inputData: Record<string, any>;
        };
  }>,

  initial: "idle",
  states: {
    idle: {
      on: {
        SET_INPUT: {
          actions: assign({
            inputId: ({ event }) => event.inputId,
          }),
        },
        SET_CONFIG: {
          actions: assign({
            inputSockets: ({ event }) => event.inputSockets,
            outputSockets: ({ event }) => event.outputSockets,
          }),
        },
        SET_VALUE: {
          actions: ["setValue", "removeError"],
        },
        RUN: {
          target: "running",
          actions: ["setValue", "removeError"],
        },
      },
    },
    running: {
      invoke: {
        src: "execute",
        input: ({ context }) => ({
          inputId: context.inputId,
          inputData: context.inputs,
        }),
        onDone: {
          target: "complete",
          actions: assign({
            outputs: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => ({
              name: (event.data as Error).name,
              message: (event.data as Error).message,
            }),
          }),
        },
      },
    },
    error: {
      on: {
        RUN: {
          target: "running",
          actions: ["setValue", "removeError"],
        },
      },
    },
    complete: {},
  },
});

export type ModuleNodeData = ParsedNode<"ModuleNode", typeof ModuleNodeMachine>;

export class ModuleNode extends BaseNode<typeof ModuleNodeMachine> {
  static nodeType = "ModuleNode" as const;
  static label = "Module";
  static description = "Node for handling module nodes";
  static icon = "component";

  static parse(params: SetOptional<ModuleNodeData, "type">): ModuleNodeData {
    return {
      ...params,
      type: "ModuleNode",
    };
  }

  module: null | Editor = null;

  constructor(di: DiContainer, data: ModuleNodeData) {
    super("ModuleNode", di, data, ModuleNodeMachine, {
      actors: {
        execute: fromPromise(async ({ input }) => {
          console.log("RUNNING", { input, module: this.module });
          const val = await this.module?.run({
            inputId: input.inputId,
            inputs: input.inputData,
          });
          console.log("RES", val);
          return val;
        }),
      },
    });
    makeObservable(this, {
      module: observable.ref,
      setModule: action,
    });

    const state = this.actor.getSnapshot();
    this.addInput("trigger", new Input(triggerSocket, "trigger"));
    this.addOutput("trigger", new Output(triggerSocket, "trigger"));
    this.addOutput("tool", new Output(objectSocket, "tool"));

    this.setModule(state.context.moduleId);

    reaction(
      () => this.snap.context.moduleId,
      async () => {
        console.log("MODULE ID ");
        if (!this.snap.context.moduleId) return;
        await this.setModule(this.snap.context.moduleId);
      },
    );

    reaction(
      () => this.module,
      async () => {
        if (this.module) {
          console.log("MODULE is set", this.module);

          if (this.snap.context.inputId) {
            const node = this.module.editor.getNode(this.snap.context.inputId);
            this.module.setInput(node.id);
          } else {
            if (this.module.selectedInput) {
              this.actor.send({
                type: "SET_INPUT",
                inputId: this.module.selectedInput?.id,
              });
            }
          }

          this.addControl(
            "Input",
            new SelectControl(() => this.snap.context.inputId, {
              placeholder: "Select Input",
              values: this.module.inputs.map((n) => ({
                key: n.id,
                value: `${n.label} | (${n.id.slice(5, 12)})`,
              })),
              change: (value) => {
                console.log("SET INPUT", value);
                this.actor.send({
                  type: "SET_INPUT",
                  inputId: value,
                });
              },
            }),
          );
        }
      },
    );

    reaction(
      () => this.module?.selectedInput,
      async () => {
        console.log("INPUT CHANGED", this.module?.selectedInput);
        const outputs = this.module?.selectedOutputs?.reduce((acc, curr) => {
          acc.push(...curr.outputSockets);
          return acc;
        }, [] as JSONSocket[]);
        this.actor.send({
          type: "SET_CONFIG",
          inputSockets: this.module?.selectedInput?.inputSockets || [],
          outputSockets: outputs || [],
        });
        this.setLabel(`Module:(${this.module?.selectedInput?.label})`);
      },
    );

    reaction(
      () => this.snap.context.inputId,
      () => {
        console.log("INPUT ID CHANGED", this.snap.context.inputId);
        this.actor.send({
          type: "SET_INPUT",
          inputId: this.snap.context.inputId!,
        });
        this.module?.setInput(this.snap.context.inputId!);
      },
    );
  }
  async setModule(moduleId: string) {
    this.module = await this.di.createEditor(moduleId);
  }
}
