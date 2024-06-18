// TODO:
// @ts-nocheck

import type { SetOptional } from "type-fest";
import { assign, createMachine } from "xstate";

import type { DiContainer } from "../../../types";
import { BaseNode, type ParsedNode } from "../../base";

const WebflowMachine = createMachine({
  id: "webflow",
  context: {
    settings: {
      webflowId: "",
      collectionId: "332471859",
      action: "addRow",
    },
  },
  initial: "idle",
  types: {} as {
    context: {
      settings: {
        webflowId: string;
        collectionId: string;
        action: "addRow" | "readRow";
      };
    };
    events: {
      type: "CONFIG_CHANGE";
      settings: {
        webflowId: string;
        collectionId: string;
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

export type WebflowData = ParsedNode<"Webflow", typeof WebflowMachine>;

export class Webflow extends BaseNode<typeof WebflowMachine> {
  static nodeType = "Webflow" as const;
  static label = "Webflow";
  static description = "Node for handling webflow";
  static icon = "webflow";

  static parse(params: SetOptional<WebflowData, "type">): WebflowData {
    return {
      ...params,
      type: "Webflow",
    };
  }

  public action: "addRow" | "readRow" = "addRow";
  constructor(di: DiContainer, data: WebflowData) {
    super("Webflow", di, data, WebflowMachine, {
      actions: {
        updateConfig: ({ event }) => {
          console.log("updateConfig", event);
          assign({
            settings: {
              webflowId: event.settings.webflowId,
            },
          });
        },
      },
    });
    const state = this.actor.getSnapshot();
    this.action = state.context.settings.action;

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

    // // this.addControl('webflowID', )
    // this.addControl(
    //   "webflowID",
    //   new InputControl(() => this.snap.context.settings.webflowId, {
    //     change: (v) => {
    //       this.actor.send({
    //         type: "CONFIG_CHANGE",
    //         settings: {
    //           webflowId: v,
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

  // async syncUI(state: StateFrom<typeof WebflowMachine>) {
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
