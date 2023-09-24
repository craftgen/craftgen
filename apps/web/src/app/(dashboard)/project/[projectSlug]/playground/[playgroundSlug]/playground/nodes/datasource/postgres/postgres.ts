import { StateFrom, assign, createMachine } from "xstate";
import { BaseNode, NodeData } from "../../base";
import { DiContainer } from "../../../editor";
import { ClassicPreset } from "rete";
import { SelectControl } from "../../../controls/select";
import { objectSocket, triggerSocket } from "../../../sockets";

const PostgresMachine = createMachine({
  id: "postgres",
  context: {
    settings: {
      postgresId: "",
      tableId: "332471859",
      action: "addRow",
    },
  },
  initial: "idle",
  types: {} as {
    context: {
      settings: {
        postgresId: string;
        tableId: string;
        action: "addRow" | "readRow";
      };
    };
    events: {
      type: "CONFIG_CHANGE";
      settings: {
        postgresId: string;
        tableId: string;
        action: "addRow" | "readRow";
      };
    };
  },
  states: {
    idle: {
      on: {
        CONFIG_CHANGE: {
          target: "idle",
          actions: assign({
            settings: ({ context, event }) => ({
              ...context.settings,
              ...event.settings,
            }),
          }),
        },
      },
    },
    running: {},
  },
});

export class Postgres extends BaseNode<typeof PostgresMachine> {
  public action: "addRow" | "readRow" = "addRow";
  constructor(di: DiContainer, data: NodeData<typeof PostgresMachine>) {
    super("Postgres", "Postgres", di, data, PostgresMachine, {
      actions: {
        updateConfig: ({ event }) => {
          console.log("updateConfig", event);
          assign({
            settings: {
              postgresId: event.settings.postgresId,
            },
          });
        },
      },
    });
    const state = this.actor.getSnapshot();
    this.action = state.context.settings.action;
    this.addInput("trigger", new ClassicPreset.Input(triggerSocket, "trigger"));
    this.addOutput(
      "trigger",
      new ClassicPreset.Output(triggerSocket, "trigger")
    );

    this.addControl(
      "action",
      new SelectControl("addRow", {
        placeholder: "Select an action",
        values: [
          {
            key: "addRow",
            value: "Add Row",
          },
          {
            key: "readRow",
            value: "Read Row",
          },
        ],
        change: (v) => {
          console.log("change", v);
          this.actor.send({
            type: "CONFIG_CHANGE",
            settings: {
              action: v,
            },
          });
        },
      })
    );

    // this.addControl('postgresID', )
    this.addControl(
      "postgresID",
      new ClassicPreset.InputControl("text", {
        initial: state.context.settings.postgresId,
        change: (v) => {
          this.actor.send({
            type: "CONFIG_CHANGE",
            settings: {
              postgresId: v,
            },
          });
        },
      })
    );

    this.actor.subscribe((state) => {
      this.action = state.context.settings.action;
      this.syncUI(state);
    });
    this.syncUI(state);
  }

  async syncUI(state: StateFrom<typeof PostgresMachine>) {
    if (state.context.settings.action === "addRow") {
      if (!this.inputs["add_row"]) {
        this.addInput(
          "add_row",
          new ClassicPreset.Input(objectSocket, "row")
        );
      }
    } else {
      if (this.inputs["add_row"]) {
        this.removeInput("add_row");
      }
    }
    if (state.context.settings.action === "readRow") {
      if (!this.outputs["read_row"]) {
        this.addOutput(
          "read_row",
          new ClassicPreset.Output(objectSocket, "row")
        );
      }
    } else {
      if (this.outputs["read_row"]) {
        this.removeOutput("read_row");
      }
    }

    console.log("syncUI", state);
  }

  execute(_: any, forward: (output: "trigger") => void) {
    forward("trigger");
  }

  async data() {
    return {};
  }

  async serialize() {
    return {};
  }
}
