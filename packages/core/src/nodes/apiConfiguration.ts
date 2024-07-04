import { createId } from "@paralleldrive/cuid2";
import { omit } from "lodash-es";
import dedent from "ts-dedent";
import { ActorRefFrom, createMachine, enqueueActions } from "xstate";

import { generateSocket } from "../controls/socket-generator";
import { outputSocketMachine } from "../output-socket";
import type { DiContainer } from "../types";
import {
  BaseNode,
  NodeContextFactory,
  type BaseContextType,
  type BaseInputType,
  type BaseMachineTypes,
  type None,
  type ParsedNode,
} from "./base";

const inputSockets = {
  baseURL: generateSocket({
    "x-key": "baseURL",
    name: "baseURL" as const,
    title: "Base URL",
    type: "string" as const,
    default: "https://api.example.com/v1",
    description: "The base URL for the API",
  }),
  APIKey: generateSocket({
    "x-key": "APIKey",
    name: "APIKey" as const,
    title: "API Key",
    type: "string" as const,
    description: "The API key for the API",
    format: "secret",
  }),
  headers: generateSocket({
    "x-key": "headers",
    name: "headers" as const,
    title: "Headers",
    type: "object" as const,
    description: "The headers for the API",
    "x-controller": "json",
    default: {
      "Content-Type": "application/json",
    },
    "x-isAdvanced": true,
  }),
};

const outputSockets = {
  config: generateSocket({
    "x-key": "config",
    name: "config" as const,
    title: "Config",
    type: "object",
    description: dedent`
    Api configuration object
    `,
    required: true,
    isMultiple: false,
    "x-showSocket": true,
  }),
  baseURL: generateSocket({
    "x-key": "baseURL",
    name: "baseURL" as const,
    title: "Base URL",
    type: "string" as const,
    description: "The base URL for the API",
    required: true,
    "x-showSocket": false,
  }),
  headers: generateSocket({
    "x-key": "headers",
    name: "headers" as const,
    title: "Headers",
    type: "object" as const,
    description: "The headers for the API",
    "x-controller": "json",
    required: true,
    "x-isAdvanced": true,
    "x-showSocket": false,
  }),
};

export const ApiConfigurationMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgEMAHASwFoBjLDAMxKgFcAnAgFxOvxCK1hPc5IQAD0QBGAEzoAnuInIFyIA */
    id: "api-configuration",
    context: (ctx) =>
      NodeContextFactory(ctx, {
        name: "API Configuration",
        description: "API Configuration",
        inputSockets,
        outputSockets,
      }),
    entry: enqueueActions(({ enqueue, self }) => {
      enqueue("initialize");
      enqueue("updateOutput");
    }),
    types: {} as BaseMachineTypes<{
      input: BaseInputType<typeof inputSockets, typeof outputSockets>;
      context: BaseContextType<typeof inputSockets, typeof outputSockets>;
      actions:
        | {
            type: "updateOutput";
          }
        | {
            type: "adjustMaxCompletionTokens";
          };
      events:
        | {
            type: "COMPUTE";
          }
        | {
            type: "RESULT";
            params: {
              inputs: {};
            };
          };
      actors: None;
      guards: None;
    }>,
    invoke: {
      src: "actorWatcher",
      input: ({ self, context }) => ({
        actor: self,
        stateSelectorPath: "context.inputs",
        event: "COMPUTE",
      }),
    },
    on: {
      ASSIGN_CHILD: {
        actions: enqueueActions(({ enqueue }) => {
          enqueue("assignChild");
        }),
      },
      INITIALIZE: {
        actions: "initialize",
      },
      SET_VALUE: {
        actions: enqueueActions(({ enqueue, event, check }) => {
          enqueue("setValue");
        }),
      },
      COMPUTE: {
        actions: enqueueActions(({ enqueue, context, self }) => {
          const childId = `compute-${createId()}`;
          enqueue.assign({
            computes: ({ spawn, context, event }) => {
              return {
                ...context.computes,
                [childId]: spawn("computeEvent", {
                  input: {
                    inputSockets: context.inputSockets,
                    inputs: {
                      ...event.params.inputs,
                    },
                    event: "RESULT",
                    parent: self,
                  },
                  systemId: childId,
                  id: childId,
                }),
              };
            },
          });
        }),
      },
      RESULT: {
        actions: enqueueActions(({ enqueue, event, check, context, self }) => {
          enqueue({
            type: "removeComputation",
          });

          const headers = { ...event.params.inputs.headers } as any;
          if (
            event.params.inputs["APIKey"] === "" ||
            event.params.inputs["APIKey"] === undefined
          ) {
            delete headers.Authorization;
          } else {
            headers.Authorization = `Bearer ${event.params.inputs["APIKey"]}`;
          }

          enqueue.assign({
            outputs: ({ event }) => {
              return {
                baseURL: event.params.inputs.baseURL,
                headers,
                config: {
                  ...event.params.inputs,
                  headers,
                },
              };
            },
          });

          enqueue("resolveOutputSockets");
        }),
      },
    },
  },
  {
    actions: {
      updateOutput: enqueueActions(({ enqueue, context }) => {
        enqueue.assign({
          outputs: ({ context }) => {
            return {
              baseURL: context.inputs.baseURL,
              headers: context.inputs.headers,
              config: {
                ...context.inputs,
              },
            };
          },
        });
      }),
    },
  },
);

export type ApiConfigurationNode = ParsedNode<
  "NodeApiConfiguration",
  typeof ApiConfigurationMachine
>;

export class NodeApiConfiguration extends BaseNode<
  typeof ApiConfigurationMachine
> {
  static title = "API Configuration";
  static label = "API Configuration";
  static description = dedent`
  The API Configuration node allows you to manage and customize your API requests.
  Here, you can set up and modify API headers, keys, and other related settings to suit your application's needs.  
  `;

  static icon = "settings";

  static machines = {
    NodeApiConfiguration: ApiConfigurationMachine,
  };

  constructor(di: DiContainer, data: ApiConfigurationNode) {
    super("NodeApiConfiguration", di, data, ApiConfigurationMachine, {});
  }
}
