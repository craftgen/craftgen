import type { SetOptional } from "type-fest";
import { assign, createMachine } from "xstate";

import type { DiContainer } from "../../../types";
import { BaseNode, type ParsedNode } from "../../base";

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

export type PostgresData = ParsedNode<"Postgres", typeof PostgresMachine>;
export class Postgres extends BaseNode<typeof PostgresMachine> {
  static nodeType = "Postgres" as const;
  static label = "Postgres";
  static description = "Node for handling postgres";
  static icon = "postgres";

  static parse(params: SetOptional<PostgresData, "type">): PostgresData {
    return {
      ...params,
      type: "Postgres",
    };
  }

  public action: "addRow" | "readRow" = "addRow";
  constructor(di: DiContainer, data: PostgresData) {
    super("Postgres", di, data, PostgresMachine, {
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

    // // this.addControl('postgresID', )
    // this.addControl(
    //   "postgresID",
    //   new InputControl(() => this.snap.context.settings.postgresId, {
    //     change: (v) => {
    //       this.actor.send({
    //         type: "CONFIG_CHANGE",
    //         settings: {
    //           postgresId: v,
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

  // async syncUI(state: StateFrom<typeof PostgresMachine>) {
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
