// TODO:
// @ts-nocheck

import { match, P } from "ts-pattern";
import type { SetOptional } from "type-fest";
import {
  assign,
  createMachine,
  fromPromise,
  type ContextFrom,
  type StateFrom,
} from "xstate";

import { GoogleDriveControl } from "../../../controls/google-drive";
import { SelectControl } from "../../../controls/select";
import type { DiContainer } from "../../../types";
import { BaseNode, type ParsedNode } from "../../base";
import { addRow, getHeaders, getSheets, readRow, readRows } from "./actions";

export interface CallbackDoc {
  downloadUrl?: string;
  uploadState?: string;
  description: string;
  driveSuccess: boolean;
  embedUrl: string;
  iconUrl: string;
  id: string;
  isShared: boolean;
  lastEditedUtc: number;
  mimeType: string;
  name: string;
  rotation: number;
  rotationDegree: number;
  serviceId: string;
  sizeBytes: number;
  type: string;
  url: string;
}

export interface GoogleSheetSettings {
  spreadsheet: CallbackDoc | undefined;
  sheet:
    | {
        id: number;
        name: string;
        headers: string[];
      }
    | undefined;
  action: GoogleSheetActionTypes;
}

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
              } as GoogleSheetSettings;
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
            inputs: ({ event }) => event.inputs,
            error: null,
          }),
        },
        CONFIG_CHANGE: {
          // actions: 'updateConfig', // TODO
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
  },
  readRows: {
    type: "readRows",
    label: "Read Rows",
    description: "Read rows from the Google Sheet, with limit and offset",
  },
} as const;

type GoogleSheetActionTypes = keyof typeof GoogleSheetActionTypes;
export type GoogleSheetMachineSettingsContext = ContextFrom<
  typeof GoogleSheetMachine
>["settings"];

export type GoogleSheetData = ParsedNode<
  "GoogleSheet",
  typeof GoogleSheetMachine
>;

export class GoogleSheet extends BaseNode<typeof GoogleSheetMachine> {
  static nodeType = "GoogleSheet" as const;
  static label = "Google Sheet";
  static description = "Google Sheet node of the workflow";
  static icon = "googleSheet";

  static parse(params: SetOptional<GoogleSheetData, "type">): GoogleSheetData {
    return {
      ...params,
      type: "GoogleSheet",
    };
  }

  public action: GoogleSheetActionTypes = "addRow";
  constructor(di: DiContainer, data: GoogleSheetData) {
    super("GoogleSheet", di, data, GoogleSheetMachine, {
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
            input as ContextFrom<typeof GoogleSheetMachine>,
          )
            .with(
              { settings: { action: "addRow" }, inputs: P.any },
              async (input) => {
                const row = await addRow({
                  settings: input.settings,
                  inputs: input.inputs,
                });
                return row;
              },
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
              },
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
              },
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

    // this.addControl(
    //   "action",
    //   new SelectControl(() => this.snap.context.settings.action, {
    //     placeholder: "Select an action",
    //     values: [
    //       ...Object.values(GoogleSheetActionTypes).map((action) => ({
    //         key: action.type,
    //         value: action.label,
    //       })),
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

    // this.addControl(
    //   "spreadsheet",
    //   new GoogleDriveControl(state.context.settings.spreadsheet, {
    //     multiselect: false,
    //     viewId: "SPREADSHEETS",
    //     onSelect: (file) => {
    //       if (file === undefined) {
    //         this.actor.send({
    //           type: "CONFIG_CHANGE",
    //           settings: {
    //             spreadsheet: undefined,
    //             sheet: undefined,
    //           },
    //         });
    //       }
    //       this.actor.send({
    //         type: "CONFIG_CHANGE",
    //         settings: {
    //           spreadsheet: file,
    //         },
    //       });
    //     },
    //   }),
    // );
  }

  // async syncUI(state: StateFrom<typeof GoogleSheetMachine>) {
  //   if (state.matches("idle")) {
  //     if (this.hasInput("trigger")) this.removeInput("trigger");
  //     if (this.hasOutput("trigger")) this.removeOutput("trigger");
  //     await this.setInputs({});
  //     await this.setOutputs({});
  //   }
  //   if (state.matches("ready")) {
  //     if (!this.hasInput("trigger"))
  //       this.addInput("trigger", new Input(triggerSocket, "trigger"));

  //     if (!this.hasOutput("trigger"))
  //       this.addOutput("trigger", new Output(triggerSocket, "trigger"));

  //     const action = state.context.settings.action;
  //     const headers = state.context.settings.sheet?.headers || [];

  //     // this section handles the inputs and outputs.
  //     await match(action)
  //       .with("addRow", async () => {
  //         await this.setInputs(
  //           headers.reduce((prev, curr) => {
  //             return {
  //               ...prev,
  //               [curr]: stringSocket,
  //             };
  //           }, {}),
  //         );
  //         await this.setOutputs({});
  //       })
  //       .with("readRow", async () => {
  //         await this.setInputs({ rowIndex: numberSocket });
  //         await this.setOutputs(
  //           headers.reduce((prev, curr) => {
  //             return {
  //               ...prev,
  //               [curr]: stringSocket,
  //             };
  //           }, {}),
  //         );
  //       })
  //       .with("readRows", async () => {
  //         await this.setInputs({ limit: numberSocket, offset: numberSocket });
  //         await this.setOutputs(
  //           headers.reduce((prev, curr) => {
  //             return {
  //               ...prev,
  //               [curr]: stringSocket,
  //             };
  //           }, {}),
  //         );
  //       })
  //       .exhaustive();
  //   }
  //   if (state.context.settings.spreadsheet) {
  //     if (!this.hasControl("sheet")) {
  //       const sheets = await getSheets(state.context.settings);
  //       console.log(sheets);
  //       this.addControl(
  //         "sheet",
  //         new SelectControl(String(state.context.settings.sheet?.id), {
  //           placeholder: "Select a sheet",
  //           values: sheets.map((sheet) => ({
  //             key: String(sheet.id),
  //             value: sheet.title,
  //           })),
  //           change: (v) => {
  //             console.log("change", v);
  //             this.actor.send({
  //               type: "CONFIG_CHANGE",
  //               settings: {
  //                 sheet: {
  //                   id: Number(v),
  //                   name: sheets.find((sheet) => sheet.id === Number(v))?.title,
  //                 },
  //               },
  //             });
  //           },
  //         }),
  //       );
  //     }
  //   } else {
  //     if (this.hasControl("sheet")) this.removeControl("sheet");
  //   }
  //   console.log("syncUI", state);
  // }
}
