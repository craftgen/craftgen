import {
  ContextFrom,
  StateFrom,
  assign,
  createMachine,
  fromPromise,
} from "xstate";
import { BaseNode, NodeData } from "../../base";
import { DiContainer } from "../../../editor";
import { ClassicPreset } from "rete";
import { SelectControl } from "../../../ui/control/control-select";
import { numberSocket, stringSocket, triggerSocket } from "../../../sockets";
import { addRow, getHeaders, getSheets, readRow, readRows } from "./actions";
import { GoogleDriveControl } from "../../../ui/control/control-google-drive";
import { CallbackDoc } from "react-google-drive-picker/dist/typeDefs";
import { P, match } from "ts-pattern";

export type GoogleSheetSettings = {
  spreadsheet: CallbackDoc | undefined;
  sheet:
    | {
        id: number;
        name: string;
        headers: string[];
      }
    | undefined;
  action: GoogleSheetActionTypes;
};

const GoogleSheetMachine = createMachine({
  id: "google-sheet",
  context: {
    settings: {
      spreadsheet: undefined,
      sheet: undefined,
      action: "addRow",
    },
    inputs: {},
    outputs: {},
    error: null,
  },
  initial: "idle",
  types: {} as {
    context: {
      inputs:
        | Record<string, any[]>
        | { limit: number; offset: number }
        | { rowIndex: number };
      outputs: Record<string, any[]>;
      settings: GoogleSheetSettings;
      error: {
        name: string;
        message: string;
      } | null;
    };
    events:
      | {
          type: "CONFIG_CHANGE";
          settings: GoogleSheetSettings;
        }
      | {
          type: "RUN";
          inputs: Record<string, any[]>;
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
      always: {
        target: "loading",
        guard: ({ context }) =>
          !!context.settings.spreadsheet && !!context.settings.sheet,
      },
    },
    loading: {
      invoke: {
        src: "getHeaders",
        input: ({ context }) => ({ context }),
        onError: {
          target: "error",
        },
        onDone: {
          target: "ready",
          actions: assign({
            settings: ({ context, event }) => {
              return {
                ...context.settings,
                sheet: {
                  ...context.settings.sheet,
                  headers: event.output,
                },
              };
            },
          }),
        },
      },
    },
    ready: {
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
        RUN: {
          target: "running",
          actions: assign({
            inputs: ({ event }) => event.inputs,
          }),
        },
      },
    },
    running: {
      invoke: {
        src: "action",
        input: ({ context }) => ({
          settings: context.settings,
          inputs: context.inputs,
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
              name: event.data.name,
              message: event.data.message,
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
            inputs: ({ event }) => event.inputs,
            error: null,
          }),
        },
        CONFIG_CHANGE: {
          actions: assign({
            settings: ({ context, event }) => ({
              ...context.settings,
              ...event.settings,
            }),
            error: null,
          }),
        },
        // SET_VALUE: {
        //   actions: assign({
        //     inputs: ({ context, event }) => ({
        //       ...context.inputs,
        //       ...event.inputs,
        //     }),
        //   }),
        // },
      },
    },
    complete: {
      on: {
        RUN: {
          target: "running",
          actions: assign({
            inputs: ({ event }) => event.inputs,
            error: null,
          }),
        },
      },
      after: {
        1000: "ready",
      },
    },
  },
});

const GoogleSheetActionTypes = {
  addRow: {
    type: "addRow",
    label: "Add Row",
    description: "Add a row to bottom of the Google Sheet",
    inputs: {},
  },
  readRow: {
    type: "readRow",
    label: "Read Row",
    description: "Read a row from the Google Sheet",
    inputs: {
      rowIndex: numberSocket,
    },
  },
  readRows: {
    type: "readRows",
    label: "Read Rows",
    description: "Read rows from the Google Sheet, with limit and offset",
    inputs: {
      limit: numberSocket,
      offset: numberSocket,
    },
  },
} as const;

type GoogleSheetActionTypes = keyof typeof GoogleSheetActionTypes;
export type GoogleSheetMachineContext = ContextFrom<
  typeof GoogleSheetMachine
>["settings"];
export class GoogleSheet extends BaseNode<typeof GoogleSheetMachine> {
  public action: GoogleSheetActionTypes = "addRow";
  constructor(di: DiContainer, data: NodeData<typeof GoogleSheetMachine>) {
    super("GoogleSheet", "Spreadsheet", di, data, GoogleSheetMachine, {
      actions: {
        updateConfig: ({ event }: any) => {
          // TODO: xstate
          console.log("updateConfig", event);
          assign({
            settings: {
              spreadsheetId: event?.settings?.spreadsheetId, // TODO: xstate
            },
          });
        },
      },
      actors: {
        getHeaders: fromPromise(async ({ input, self }) => {
          console.log("getHeaders", input);
          const headers = await getHeaders(input.context.settings);
          return headers;
        }),
        action: fromPromise(async ({ input, self }) => {
          const res = await match(
            input as ContextFrom<typeof GoogleSheetMachine>
          )
            .with(
              { settings: { action: "addRow" }, inputs: P.any },
              async (input) => {
                const row = await addRow({
                  settings: input.settings,
                  inputs: input.inputs,
                });
                return row;
              }
            )
            .with(
              {
                settings: { action: "readRow" },
                inputs: { rowIndex: P.number },
              },
              async (input) => {
                const row = await readRow({
                  settings: input.settings,
                  rowIndex: input.inputs.rowIndex,
                });
                return row;
              }
            )
            .with(
              {
                settings: { action: "readRows" },
                inputs: { limit: P.number, offset: P.number },
              },
              async (input) => {
                const rows = await readRows({
                  settings: input.settings,
                  limit: input.inputs.limit,
                  offset: input.inputs.offset,
                });
                return rows;
              }
            )
            .otherwise(() => {
              throw new Error("Invalid action");
            });
          return res;
        }),
      },
    });
    const state = this.actor.getSnapshot();
    this.action = state.context.settings.action;

    this.addControl(
      "action",
      new SelectControl("addRow", {
        placeholder: "Select an action",
        values: [
          ...Object.values(GoogleSheetActionTypes).map((action) => ({
            key: action.type,
            value: action.label,
          })),
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

    this.addControl(
      "spreadsheet",
      new GoogleDriveControl(state.context.settings.spreadsheet, {
        multiselect: false,
        viewId: "SPREADSHEETS",
        onSelect: (file) => {
          if (file === undefined) {
            this.actor.send({
              type: "CONFIG_CHANGE",
              settings: {
                spreadsheet: undefined,
                sheet: undefined,
              },
            });
          }
          this.actor.send({
            type: "CONFIG_CHANGE",
            settings: {
              spreadsheet: file,
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

  async syncUI(state: StateFrom<typeof GoogleSheetMachine>) {
    if (state.matches("idle")) {
      if (this.hasInput("trigger")) this.removeInput("trigger");
      if (this.hasOutput("trigger")) this.removeOutput("trigger");
      await this.setInputs({});
      await this.setOutputs({});
    }
    if (state.matches("ready")) {
      if (!this.hasInput("trigger"))
        this.addInput(
          "trigger",
          new ClassicPreset.Input(triggerSocket, "trigger")
        );

      if (!this.hasOutput("trigger"))
        this.addOutput(
          "trigger",
          new ClassicPreset.Output(triggerSocket, "trigger")
        );

      const action = state.context.settings.action;
      const headers = state.context.settings.sheet?.headers || [];

      // this section handles the inputs and outputs.
      await match(action)
        .with("addRow", async () => {
          await this.setInputs(
            headers.reduce((prev, curr) => {
              return {
                ...prev,
                [curr]: stringSocket,
              };
            }, {})
          );
          await this.setOutputs({});
        })
        .with("readRow", async () => {
          await this.setInputs({ rowIndex: numberSocket });
          await this.setOutputs(
            headers.reduce((prev, curr) => {
              return {
                ...prev,
                [curr]: stringSocket,
              };
            }, {})
          );
        })
        .with("readRows", async () => {
          await this.setInputs({ limit: numberSocket, offset: numberSocket });
          await this.setOutputs(
            headers.reduce((prev, curr) => {
              return {
                ...prev,
                [curr]: stringSocket,
              };
            }, {})
          );
        })
        .exhaustive();
    }
    if (state.context.settings.spreadsheet) {
      if (!this.hasControl("sheet")) {
        const sheets = await getSheets(state.context.settings);
        console.log(sheets);
        this.addControl(
          "sheet",
          new SelectControl(String(state.context.settings.sheet?.id), {
            placeholder: "Select a sheet",
            values: sheets.map((sheet) => ({
              key: String(sheet.id),
              value: sheet.title,
            })),
            change: (v) => {
              console.log("change", v);
              this.actor.send({
                type: "CONFIG_CHANGE",
                settings: {
                  sheet: {
                    id: Number(v),
                    name: sheets.find((sheet) => sheet.id === Number(v))?.title,
                  },
                },
              });
            },
          })
        );
      }
    } else {
      if (this.hasControl("sheet")) this.removeControl("sheet");
    }
    console.log("syncUI", state);
  }

  async execute(_: any, forward: (output: "trigger") => void) {
    this.di.dataFlow?.reset();
    const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
      [x: string]: string;
    };
    const state = this.actor.getSnapshot();
    Object.keys(this.inputs).forEach((key) => {
      if (!inputs[key] && this.inputs[key]?.control) {
        inputs[key] = state.context.inputs[key];
      }
    });

    // Normalize inputs based on if input accepts multipleConnections
    // If not, flatten the value instead of array
    Object.keys(inputs).forEach((key) => {
      if (!this.inputs[key]?.multipleConnections) {
        inputs[key] = Array.isArray(inputs[key]) ? inputs[key][0] : inputs[key];
      }
    });

    this.actor.send({
      type: "RUN",
      inputs,
    });

    const subs = this.actor.subscribe((state) => {
      if (state.matches("complete")) {
        console.log("COMPLETE", { outputs: state.context.outputs });
        forward("trigger");
      }
    });
    subs.unsubscribe();
  }

  async data() {
    let state = this.actor.getSnapshot();
    if (this.inputs.trigger) {
      this.actor.subscribe((newState) => {
        state = newState;
        console.log("state", newState);
      });
      while (state.matches("running")) {
        console.log("waiting for complete");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    return state.context.outputs;
  }

  async serialize() {
    return {};
  }
}
