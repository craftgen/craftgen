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
import { stringSocket, triggerSocket } from "../../../sockets";
import { addRow, getHeaders, getSheets } from "./actions";
import { GoogleDriveControl } from "../../../ui/control/control-google-drive";
import { CallbackDoc } from "react-google-drive-picker/dist/typeDefs";

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
      inputs: Record<string, any[]>;
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
        // CONFIG_CHANGE: {
        //   actions: assign({
        //     settings: ({ context, event }) => mergeSettings(context, event),
        //   }),
        // },
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
        1000: "idle",
      },
    },
  },
});

const GoogleSheetActionTypes = {
  addRow: "addRow",
  readRow: "readRow",
} as const;

type GoogleSheetActionTypes = keyof typeof GoogleSheetActionTypes;
export type GoogleSheetMachineContext = ContextFrom<typeof GoogleSheetMachine>;

export const GoogleSheetActions: Record<
  GoogleSheetActionTypes,
  ({ input }: { input: ContextFrom<typeof GoogleSheetMachine> }) => Promise<any>
> = {
  addRow: async ({
    input,
  }: {
    input: ContextFrom<typeof GoogleSheetMachine>;
  }): Promise<string> => {
    console.log("Running addRow", input);
    await addRow(input);

    return "yes";
  },
  readRow: async ({}) => {
    console.log("Running readRow");
    // await readRow();
    return "yes";
  },
} as const;

// type GoogleSheetActionTypes = keyof typeof GoogleSheetActions;

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
          const headers = await getHeaders(input.context);
          return headers;
        }),
        action: fromPromise(async ({ input, self }) => {
          console.log("action", input);
          const res = await GoogleSheetActions[
            input.settings.action as GoogleSheetActionTypes
          ]({
            input,
          });
          return { res };
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
      const headers = await getHeaders(state.context);

      if (action === "addRow") {
        await this.setInputs(
          headers.reduce((prev, curr) => {
            return {
              ...prev,
              [curr]: stringSocket,
            };
          }, {})
        );
        await this.setOutputs({});
      }

      if (action === "readRow") {
        await this.setInputs({});
        await this.setOutputs(
          headers.reduce((prev, curr) => {
            return {
              ...prev,
              [curr]: stringSocket,
            };
          }, {})
        );
      }
    }
    if (state.context.settings.spreadsheet) {
      if (!this.hasControl("sheet")) {
        const sheets = await getSheets(state.context);
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

    this.actor.subscribe((state) => {
      if (state.matches("complete")) {
        console.log("COMPLETE", { outputs: state.context.outputs });
        forward("trigger");
      }
    });
  }

  async data() {
    return {};
  }

  async serialize() {
    return {};
  }
}
