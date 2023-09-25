import { StateFrom, assign, createMachine, fromPromise } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { ClassicPreset, NodeEditor } from "rete";
import {
  anySocket,
  getSocketByJsonSchemaType,
  triggerSocket,
} from "../../sockets";
import { Module, Modules } from "../../modules";
import { Schemes } from "../../types";
import { getPlaygrounds } from "@/app/(dashboard)/project/[projectSlug]/actions";
import { Input as InputNode } from "./input";
import { SelectControl } from "../../controls/select";
import { JSONSocket } from "../../controls/socket-generator";
import { SWRSelectControl } from "../../controls/swr-select";
import { ConsoleLogWriter } from "@seocraft/supabase/db";

const ModuleNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QFkD2ECuAbMA5dYAdAJYQ4DEAygKIAqA+sgPIAiAqgDLUDaADALqJQAB1SxiAF2KoAdkJAAPRAFoAbIQCsAZg0BGDaoBMGgDQgAnokO8A7IQAshgJyr7qgBy8n7pxvf2AXwCzNEwcfAgiAGNZGTAoiUgqOkZWTh4BeVFxKVl5JQR9XUJed2stXWMzS0KtdRteCuMgkPRsPAJCGJk4hKSaBgBhJlwAMQBJAHE+QSQQbMlpOTmC-XtCVVdeI1MLRHteQmbgkFD2iOjY+MSIcgAlNlwZrLFFvJWrJycN9xtdmsM9g0hH0Rl0TnsZUcunc7iCJxkBHgczO4QILxyS3yKl0WncJR0oKqewQynsdmOrTCHUiJDIYAxb2WoAKyich0aegMxIBWkO7KMXj53l8vxapzaaNp3V6N0ZuWZikQulcJScWj+1SseJB3PBkMBhhhcJOqJpRAAThgesQZFB5ViPgh7OCfpqSYYtN8ifqoUbYfCAkA */
  id: "ModuleNode",
  types: {} as {
    context: {
      moduleId?: string;
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
          inputs: Record<string, any>;
          outputs: Record<string, any>;
        }
      | {
          type: "RUN";
          inputData: Record<string, any>;
        };
  },
  context: {
    moduleId: undefined,
    inputId: undefined,
    inputs: [],
    outputs: [],
    error: null,
    inputData: {},
    outputData: {},
  },
  initial: "idle",
  states: {
    idle: {
      on: {
        SET_MODULE: {
          target: "chooseInput",
          actions: assign({
            moduleId: ({ event }) => event.moduleId,
          }),
        },
      },
    },
    chooseInput: {
      on: {
        SET_INPUT: {
          target: "connected",
          actions: assign({
            inputId: ({ event }) => event.inputId,
          }),
        },
      },
    },
    connected: {
      on: {
        SET_MODULE: {
          target: "connected",
          actions: assign({
            moduleId: ({ event }) => event.moduleId,
          }),
        },

        SET_CONFIG: {
          target: "connected",
          actions: assign({
            inputs: ({ event }) => event.inputs,
            outputs: ({ event }) => event.outputs,
          }),
        },

        RUN: {
          target: "running",
          actions: assign({
            inputData: ({ event }) => event.inputData,
          }),
        },
      },
    },

    running: {
      invoke: {
        src: "execute",
        input: ({ context }) => ({
          inputId: context.inputId,
          inputData: context.inputData,
        }),
        onDone: {
          target: "connected",
          actions: assign({
            outputData: ({ event }) => event.output,
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
          actions: assign({
            inputData: ({ event }) => event.inputData,
            error: null,
          }),
        },
      },
    },
  },
});

export class ModuleNode extends BaseNode<typeof ModuleNodeMachine> {
  module: null | Module = null;

  constructor(di: DiContainer, data: NodeData<typeof ModuleNodeMachine>) {
    super("ModuleNode", "Module", di, data, ModuleNodeMachine, {
      actors: {
        execute: fromPromise(async ({ input }) => {
          console.log("RUNNING", { input, module: this.module });
          const val = await this.module?.exec(input.inputId, input.inputData);
          console.log("RES", val);
          return val;
        }),
      },
    });
    const state = this.actor.getSnapshot();
    if (state.context.moduleId && state.context.inputId) {
      this.update();
    }
    this.syncUI(state);
    this.addInput("trigger", new ClassicPreset.Input(triggerSocket, "trigger"));
    this.addOutput(
      "trigger",
      new ClassicPreset.Output(triggerSocket, "trigger")
    );
    this.actor.subscribe((state) => this.syncUI(state));

    this.syncPorts(state.context.inputs, state.context.outputs);
  }

  async syncUI(state: StateFrom<typeof ModuleNodeMachine>) {
    const store = this.di.store.getState();
    if (state.matches("idle")) {
      this.addControl(
        "module",
        new SWRSelectControl(
          state.context.moduleId,
          "Select Module",
          `/api/playgrounds/${store.projectId}`, // TODO get from project
          async () => {
            return await getPlaygrounds(store.projectId);
          },
          (data) => {
            return data.map((playground) => ({
              key: playground.id,
              value: playground.name,
            }));
          },
          (value: string) => {
            this.actor.send({
              type: "SET_MODULE",
              moduleId: value,
            });
          }
        )
      );
    } else {
      this.removeControl("module");
    }
    if (state.matches("chooseInput") || state.matches("connected")) {
      console.log("** SETTING MODULE");
      this.module = await this.di.modules.findModule(state.context.moduleId!);
      console.log("** MODULE SET", this.module);
    }
    if (state.matches("chooseInput")) {
      if (this.controls.select_input) {
        this.removeControl("select_input");
      }
      const inputs =
        this.module?.editor
          .getNodes()
          .filter((node) => node instanceof InputNode)
          .map((n) => ({
            key: n.id,
            value: n.actor.getSnapshot().context.name,
          })) || [];

      this.addControl(
        "select_input",
        new SelectControl(state.context.inputId, {
          placeholder: "Select Input",
          values: inputs,
          change: (value) => {
            console.log("SET INPUT", value);
            this.actor.send({
              type: "SET_INPUT",
              inputId: value,
            });
            this.update();
          },
        })
      );
    } else {
      this.removeControl("select_input");
    }
  }

  async execute(_: any, forward: (output: "trigger") => void) {
    this.di.dataFlow?.reset();
    const inputs = await this.di?.dataFlow?.fetchInputs(this.id);
    this.actor.send({
      type: "RUN",
      inputData: inputs,
    });

    this.actor.subscribe((state) => {
      if (state.matches("complete")) {
        console.log("COMPLETE", { message: state.context.message });
        forward("trigger");
      }
    });
  }

  async update() {
    const state = this.actor.getSnapshot();
    const newModule = await this.di.modules.findModule(state.context.moduleId);
    if (this.module !== newModule) {
      this.module = newModule;
    }

    if (this.module) {
      const editor = new NodeEditor<Schemes>();
      await this.module.apply(editor);

      const { inputs, outputs } = Modules.getPorts({
        editor,
        graph: this.module?.graph,
        inputId: state.context.inputId,
      });
      this.actor.send({
        type: "SET_CONFIG",
        inputs,
        outputs,
      });
      this.syncPorts(inputs, outputs);
    } else this.syncPorts([], []);
    return true;
  }

  syncPorts(inputs: JSONSocket[], outputs: JSONSocket[]) {
    /**
     * Flush all ports
     */
    Object.entries(this.inputs).forEach(([key, input]) => {
      if (key === "trigger") return;
      this.removeInput(key);
    });
    Object.entries(this.outputs).forEach(([key, output]) => {
      if (key === "trigger") return;
      this.removeOutput(key);
    });

    inputs.forEach((item) => {
      const socket = getSocketByJsonSchemaType(item.type)!;
      const input = new ClassicPreset.Input(socket, item.name);
      input.addControl(
        new ClassicPreset.InputControl("text", {
          initial: item.description,
          change: (value) => {
            this.actor.send({
              type: "change",
              name: item.name,
              description: value,
            });
          },
        })
      );
      this.addInput(item.name, input);
    });
    outputs.forEach((item) => {
      const socket = getSocketByJsonSchemaType(item.type)!;
      const output = new ClassicPreset.Output(socket, item.name);
      this.addOutput(item.name, output);
    });
    this.height =
      110 +
      25 * (Object.keys(this.inputs).length + Object.keys(this.outputs).length);
  }

  async data(inputs: Record<string, any>) {
    let state = this.actor.getSnapshot();
    if (this.inputs.trigger) {
      this.actor.subscribe((newState) => {
        state = newState;
      });
      while (state.matches("running")) {
        console.log("waiting for complete");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    return {
      message: state.context.message,
    };
  }

  async serialize() {
    return {};
  }
}
