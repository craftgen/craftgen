import { assign, createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { ClassicPreset, NodeEditor } from "rete";
import { anySocket, triggerSocket } from "../../sockets";
import { Module, Modules } from "../../modules";
import { Schemes } from "../../types";
import { SWRSelectControl } from "../../ui/control/control-swr-select";
import { getPlaygrounds } from "@/app/(dashboard)/project/[projectSlug]/actions";

const ModuleNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QFkD2ECuAbMA5dYAdAJYQ4DEAygKIAqA+sgPIAiAqgDLUDaADALqJQAB1SxiAF2KoAdkJAAPRAFoAbIQCsAZg0BGDaoBMGgDQgAnokO8A7IQAshgJyr7qgBy8n7pxvf2AXwCzNEwcfAgiAGNZGTAoiUgqOkZWTh4BeVFxKVl5JQR9XUJed2stXWMzS0KtdRteCuMgkPRsPAJCGJk4hKSaBgBhJlwAMQBJAHE+QSQQbMlpOTmC-XtCVVdeI1MLRHteQmbgkFD2iOjY+MSIcgAlNlwZrLFFvJWrJycN9xtdmsM9g0hH0Rl0TnsZUcunc7iCJxkBHgczO4QILxyS3yKl0WncJR0oKqewQynsdmOrTCHUiJDIYAxb2WoAKyich0aegMxIBWkO7KMXj53l8vxapzaaNp3V6N0ZuWZikQulcJScWj+1SseJB3PBkMBhhhcJOqJpRAAThgesQZFB5ViPgh7OCfpqSYYtN8ifqoUbYfCAkA */
  id: "ModuleNode",
  types: {} as {
    context: {
      moduleId: string | null;
      inputs: Record<string, any>;
      outputs: Record<string, any>;
    };
    events:
      | {
          type: "SET_MODULE";
          moduleId: string;
        }
      | {
          type: "SET_CONFIG";
          inputs: Record<string, any>;
          outputs: Record<string, any>;
        }
      | {
          type: "RUN";
        };
  },
  context: {
    moduleId: null,
    inputs: [],
    outputs: [],
  },
  initial: "idle",
  states: {
    idle: {
      on: {
        SET_MODULE: {
          target: "connected",
          actions: assign({
            moduleId: ({ event }) => event.moduleId,
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

        RUN: "running",
      },
    },

    running: {},
  },
});

export class ModuleNode extends BaseNode<typeof ModuleNodeMachine> {
  module: null | Module = null;

  constructor(di: DiContainer, data: NodeData<typeof ModuleNodeMachine>) {
    super("Module", di, data, ModuleNodeMachine, {});
    const state = this.actor.getSnapshot();
    const store = this.di.store.getState();
    console.log("MOUDLEUA", state);
    if (state.matches("connected")) {
      console.log("ModuleNode", state);
      const module = this.di.modules.findModule(state.context.moduleId);
      this.module = module;
      console.log("ModuleNode", module);
    }
    this.addInput("trigger", new ClassicPreset.Input(triggerSocket, "trigger"));
    this.addOutput(
      "trigger",
      new ClassicPreset.Output(triggerSocket, "trigger")
    );
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
          this.update();
        }
      )
    );

    this.syncPorts(state.context.inputs, state.context.outputs);
  }

  async execute(_: any, forward: (output: "trigger") => void) {
    console.log("MODULE EXEECT");

    forward("trigger");
  }

  async update() {
    const state = this.actor.getSnapshot();
    const module = this.di.modules.findModule(state.context.moduleId);
    if (this.module === module) return false;
    this.module = module;

    // await removeConnections(this.di.editor, this.id);
    if (this.module) {
      const editor = new NodeEditor<Schemes>();
      console.log("Applying Module", this.module);
      await this.module.apply(editor);

      const { inputs, outputs } = Modules.getPorts(editor);
      this.actor.send({
        type: "SET_CONFIG",
        inputs,
        outputs,
      });
      console.log(inputs, outputs);
      this.syncPorts(inputs, outputs);
    } else this.syncPorts([], []);
    return true;
  }

  syncPorts(inputs: string[], outputs: string[]) {
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

    inputs.forEach((key) => {
      this.addInput(key, new ClassicPreset.Input(anySocket, key)); // TODO: match type
    });
    outputs.forEach((key) => {
      this.addOutput(key, new ClassicPreset.Output(anySocket, key)); // TODO: match type
    });
    this.height =
      110 +
      25 * (Object.keys(this.inputs).length + Object.keys(this.outputs).length);
  }

  async data(inputs: Record<string, any>) {
    const data = await this.module?.exec(inputs);
    console.log("ModuleNode data", data, this.module);

    return data || {};
  }

  async serialize() {
    return {};
  }
}
