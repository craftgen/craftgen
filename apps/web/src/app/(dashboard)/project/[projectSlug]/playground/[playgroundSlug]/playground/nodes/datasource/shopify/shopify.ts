import { StateFrom, assign, createMachine } from "xstate";
import { BaseNode, NodeData } from "../../base";
import { DiContainer } from "../../../editor";
import { ClassicPreset } from "rete";
import { objectSocket, triggerSocket } from "../../../sockets";
import { SelectControl } from "../../../controls/select";

const ShopifyMachine = createMachine({
  id: "shopify",
  context: {
    settings: {
      spreadsheetId: "",
      sheetId: "332471859",
      action: "addRow",
    },
  },
  initial: "idle",
  types: {} as {
    context: {
      settings: {
        spreadsheetId: string;
        sheetId: string;
        action: "addRow" | "readRow";
      };
    };
    events: {
      type: "CONFIG_CHANGE";
      settings: {
        spreadsheetId: string;
        sheetId: string;
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

export class Shopify extends BaseNode<typeof ShopifyMachine> {
  public action: "addRow" | "readRow" = "addRow";
  constructor(di: DiContainer, data: NodeData<typeof ShopifyMachine>) {
    super("Shopify",  di, data, ShopifyMachine, {
      actions: {
        updateConfig: ({ event }) => {
          console.log("updateConfig", event);
          assign({
            settings: {
              spreadsheetId: event.settings.spreadsheetId,
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

    // this.addControl('spreedsheetID', )
    this.addControl(
      "spreedsheetID",
      new ClassicPreset.InputControl("text", {
        initial: state.context.settings.spreadsheetId,
        change: (v) => {
          this.actor.send({
            type: "CONFIG_CHANGE",
            settings: {
              spreadsheetId: v,
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

  async syncUI(state: StateFrom<typeof ShopifyMachine>) {
    if (state.context.settings.action === "addRow") {
      if (!this.inputs["add_row"]) {
        this.addInput("add_row", new ClassicPreset.Input(objectSocket, "row"));
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
