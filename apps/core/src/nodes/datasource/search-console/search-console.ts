import { merge } from "lodash-es";
import type { SetOptional } from "type-fest";
import {
  assign,
  createMachine,
  fromPromise,
  type PromiseActorLogic,
} from "xstate";

import type { RouterInputs, RouterOutputs } from "@craftgen/api";

import { generateSocket } from "../../../controls/socket-generator";
import type { DiContainer } from "../../../types";
import { BaseNode, type BaseMachineTypes, type ParsedNode } from "../../base";

export const GoogleSearchConsoleMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SzAQwE4GMAWBaTA9gHawEA2YAdAJYQUDEASgKoByA2gAwC6ioADgVjUALtWJ8QAD0QBGABwAmSgHYVAZgAsmxQFZ1G3bNmaANCACecpZU0bZnTos3yVANjUBfT+ZQYc+MSkFDR0YPQAygCiACoA+gBqAIIAMsxRXLxIIILCYhLZMgg65lYI8rKURgCc1W7ymrLqDtUm3r5oWHiEJORU6ACuRETURFCUEGAiYOgAtqNgSZj5RPSZkrmi4kSSRS7KtbUNrfLV8uqKpYiKBpSKN5ynio+KKkry7SB+XYG9IYPDUbjACOAxmFnoEGIVFGADcCABrKjfAI9YL9IYjMaUUHghBwgiYVArTLrbKbFa7RBvTiUThvBzyU6PTjqK4IWTVXSUNxuZrVOwqTS6XRclSfFHdIJ9SgArEgsHoCEzdAEdCUfhkYkAMzVs0okt+6NlmKBOMVFnxRHhRJJPDJAiEWwKoCKNLpDMezPkrPZilOlGMfMUblqbk4uiF4s+RAIk3g2UNaL6GydlMKiFwbnZuG51RUh0LRejHX8Ur+MLCqby2ypCBUtL5HkU1ScXPUnC57IUBw0jxF6mqzzOHx8X06qOl-1NY2rzp2GYQemqPJcmmaKmMFTcsm7smU92a6g7BmcunkbglE-LxrlZsm0zmCyW6cdNZd0kQHZUq4aG63sg7n66huHcDynJonDGPm1RXmWRoyne2K4kqc6vp+CCRvIdLyKKnayPorKct2tSqDcDgmLorIinBPzJiEhCzJqUxgGhtaLkO3Ksq2ug6K2obCn6sg-ny+ZCoOFwFo8tGThWlAqmqbEfkUnF0oOEZ8ZwAm6H6TKBoBzTOAWjRDt43hAA */
  id: "search-console",
  initial: "idle",
  context: ({ input }) =>
    merge(
      {
        action: {
          type: "query",
          inputs: {},
        },
        inputs: {},
        inputSockets: {
          startDate: generateSocket({
            title: "Start Date",
            name: "startDate",
            type: "date",
            "x-key": "startDate",
            description: "Start Date",
            required: true,
            isMultiple: false,
          }),
          endDate: generateSocket({
            name: "endDate",
            "x-key": "endDate",
            type: "date",
            description: "End Date",
            required: true,
            isMultiple: false,
          }),
        },
        outputs: {},
        outputSockets: {
          GoogleSearchConsole: generateSocket({
            name: "result",
            type: "GoogleSearchConsole",
            description: "Result",
            required: true,
            "x-showSocket": true,
            "x-key": "GoogleSearchConsole",
          }),
          result: generateSocket({
            name: "result",
            type: "object",
            description: "Result",
            required: true,
            "x-showSocket": true,
            "x-key": "result",
          }),
        },
        error: null,
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      action: {
        type: "query";
        inputs: RouterInputs["google"]["searchConsole"]["query"];
      };
    };
    context: {
      action: {
        type: "query";
        inputs: RouterInputs["google"]["searchConsole"]["query"];
      };
    };
    actions: any;
    actors: {
      src: "query";
      logic: PromiseActorLogic<
        RouterOutputs["google"]["searchConsole"]["query"],
        RouterInputs["google"]["searchConsole"]["query"]
      >;
    };
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
        SET_VALUE: {
          actions: ["setValue"],
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
          entry: [
            assign({
              action: ({ context }) => ({
                ...context.action,
                inputs: {
                  siteUrl: "sc-domain:ailifestory.com",
                  requestBody: {
                    ...context.action.inputs.requestBody,
                    startDate: context.inputs.startDate,
                    endDate: context.inputs.endDate,
                  },
                },
              }),
            }),
          ],
          invoke: {
            src: "query",
            input: ({ context }) => context.action.inputs,
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
        query: fromPromise(({ input }) =>
          this.di.api.trpc.google.searchConsole.query.query(input),
        ),
      },
    });

    // this.addControl(
    //   "site",
    //   new SWRSelectControl(
    //     () => this.snap.context.inputs.siteUrl,
    //     "select site",
    //     "trpc.google.searchConsole.sites",
    //     () => this.di.api.trpc.google.searchConsole.sites.query(),
    //     (vals) =>
    //       vals.map((v) => ({
    //         key: v.siteUrl || v.url,
    //         value: v.url,
    //       })),
    //     (val) => {
    //       this.actor.send({
    //         type: "SET_VALUE",
    //         params: {
    //           values: {
    //             siteUrl: val,
    //           },
    //         },
    //       });
    //     },
    //   ),
    // );
  }
}
