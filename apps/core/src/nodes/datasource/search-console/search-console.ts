import { sub } from "date-fns";
import { merge } from "lodash-es";
import { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise } from "xstate";

import { DiContainer } from "../../../types";
import { BaseMachineTypes, BaseNode, ParsedNode } from "../../base";

export const GoogleSearchConsoleMachine = createMachine({
  id: "search-console",
  initial: "idle",
  context: ({ input }) =>
    merge(
      {
        action: {
          type: "query",
          siteUrl: "",
          requestBody: {},
        },
        inputs: {},
        inputSockets: [
          {
            name: "startDate",
            type: "date",
            description: "Start Date",
            required: true,
            isMultiple: false,
          },
          {
            name: "endDate",
            type: "date",
            description: "End Date",
            required: true,
            isMultiple: false,
          },
        ],
        outputs: {},
        outputSockets: [],
        error: null,
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      action: {
        type: "query";
        siteUrl: string;
        requestBody: {
          startDate?: string;
          endDate?: string;
        };
      };
    };
    context: {
      action: {
        type: "query";
        siteUrl: string;
        requestBody: {
          startDate?: string;
          endDate?: string;
        };
      };
    };
    actions: any;
    actors: any;
    events: {
      type: "R";
    };
  }>,
  states: {
    idle: {
      on: {
        RUN: {
          target: "running",
        },
      },
    },
    running: {
      initial: "determineAction",
      states: {
        determineAction: {
          always: [
            {
              guard: ({ context }) => context.action.type === "query",
              target: "#search-console.running.query",
            },
          ],
        },
        query: {
          invoke: {
            src: "query",
            onDone: {
              target: "#search-console.complete",
              actions: [
                assign({
                  outputs: ({ event }) => event.output,
                }),
              ],
            },
            onError: {
              target: "#search-console.error",
            },
          },
        },
      },
    },
    complete: {},
    error: {},
  },
});

export type GoogleSearchConsoleData = ParsedNode<
  "GoogleSearchConsole",
  typeof GoogleSearchConsoleMachine
>;

export class GoogleSearchConsole extends BaseNode<
  typeof GoogleSearchConsoleMachine
> {
  static nodeType = "GoogleSearchConsole" as const;
  static label = "Google Search Console";
  static description = "Google Search Console node of the workflow";
  static icon = "searchConsole";

  static parse(
    params: SetOptional<GoogleSearchConsoleData, "type">,
  ): GoogleSearchConsoleData {
    return {
      ...params,
      type: "GoogleSearchConsole",
    };
  }

  constructor(di: DiContainer, data: GoogleSearchConsoleData) {
    super("GoogleSearchConsole", di, data, GoogleSearchConsoleMachine, {
      actors: {
        query: fromPromise(async ({ input }) => {
          const data = this.di.api.trpc.google.searchConsole.query.query({
            requestBody: {
              startDate: sub(new Date(), { days: 10 }),
              endDate: sub(new Date(), { days: 3 }),
            },
            siteUrl: "sc-domain:ailifestory.com",
          });
          return data;
        }),
      },
    });
  }
}
