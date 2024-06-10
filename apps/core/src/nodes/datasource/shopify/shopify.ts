// TODO:
// @ts-nocheck

import type { SetOptional } from "type-fest";
import { assign, createMachine, type StateFrom } from "xstate";

import { generateSocket } from "../../../controls/socket-generator";
import type { DiContainer } from "../../../types";
import { BaseNode, type ParsedNode } from "../../base";

const ShopifyMachine = createMachine({
  id: "shopify",
  context: {
    settings: {
      spreadsheetId: "",
      sheetId: "332471859",
      action: "getSalesTotal",
    },
    inputs: {},
    outputs: {},
    inputSockets: {
      endDate: generateSocket({
        name: "endDate",
        "x-key": "endDate",
        type: "date",
        description: "End Date",
        required: true,
        isMultiple: false,
      }),
      startDate: generateSocket({
        title: "Start Date",
        name: "startDate",
        type: "date",
        "x-key": "startDate",
        description: "Start Date",
        required: true,
        isMultiple: false,
      }),
    },
    outputSockets: {
      result: generateSocket({
        name: "result",
        type: "object",
        description: "Result",
        required: true,
        "x-showSocket": true,
        "x-key": "result",
      }),
      Shopify: generateSocket({
        name: "result",
        type: "Shopify",
        description: "Result",
        required: true,
        "x-showSocket": true,
        "x-key": "Shopify",
      }),
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

export type ShopifyData = ParsedNode<"Shopify", typeof ShopifyMachine>;

export class Shopify extends BaseNode<typeof ShopifyMachine> {
  static nodeType = "Shopify" as const;
  static label = "Shopify";
  static description = "Node for handling shopify";
  static icon = "shopify";

  static parse(params: SetOptional<ShopifyData, "type">): ShopifyData {
    return {
      ...params,
      type: "Shopify",
    };
  }

  public action: "addRow" | "readRow" = "getSalesTotal";
  constructor(di: DiContainer, data: ShopifyData) {
    super("Shopify", di, data, ShopifyMachine, {
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
    // const state = this.actor.getSnapshot();
    // this.action = state.context.settings.action;

    // this.addControl(
    //   "action",
    //   new SelectControl("addRow", {
    //     placeholder: "Select an action",
    //     values: [
    //       {
    //         key: "addRow",
    //         value: "Add Row",
    //       },
    //       {
    //         key: "readRow",
    //         value: "Read Row",
    //       },
    //     ],
    //     change: (v) => {
    //       console.log("change", v);
    //       this.actor.send({
    //         type: "CONFIG_CHANGE",
    //         settings: {
    //           action: v,
    //         },
    //       });
    //     },
    //   }),
    // );

    // this.addControl('spreedsheetID', )
    // this.addControl(
    //   "spreedsheetID",
    //   new InputControl(() => this.snap.context.settings.spreadsheetId, {
    //     change: (v) => {
    //       this.actor.send({
    //         type: "CONFIG_CHANGE",
    //         settings: {
    //           spreadsheetId: v,
    //         },
    //       });
    //     },
    //   }),
    // );

    // this.actor.subscribe((state) => {
    //   this.action = state.context.settings.action;
    //   this.syncUI(state);
    // });
    // this.syncUI(state);
  }

  // async syncUI(state: StateFrom<typeof ShopifyMachine>) {
  //   if (state.context.settings.action === "addRow") {
  //     if (!this.inputs.add_row) {
  //       this.addInput("add_row", new Input(objectSocket, "row"));
  //     }
  //   } else {
  //     if (this.inputs.add_row) {
  //       this.removeInput("add_row");
  //     }
  //   }
  //   if (state.context.settings.action === "readRow") {
  //     if (!this.outputs.read_row) {
  //       this.addOutput("read_row", new Output(objectSocket, "row"));
  //     }
  //   } else {
  //     if (this.outputs.read_row) {
  //       this.removeOutput("read_row");
  //     }
  //   }

  //   console.log("syncUI", state);
  // }
}
