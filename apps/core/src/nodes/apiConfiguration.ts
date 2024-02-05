import { has, isNil, merge } from "lodash-es";
import dedent from "ts-dedent";
import { createMachine, assign, enqueueActions } from "xstate";

import { generateSocket } from "../controls/socket-generator";
import type { DiContainer } from "../types";
import type {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  None,
  ParsedNode,
} from "./base";
import { BaseNode } from "./base";

const inputSockets = {
  baseUrl: generateSocket({
    "x-key": "baseUrl",
    name: "baseUrl" as const,
    title: "Base URL",
    type: "string" as const,
    default: "https://api.example.com/v1",
    description: "The base URL for the API",
    required: true,
  }),
  APIKey: generateSocket({
    "x-key": "APIKey",
    name: "APIKey" as const,
    title: "API Key",
    type: "string" as const,
    description: "The API key for the API",
    required: true,
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
    required: true,
    "x-isAdvanced": true,
  }),
};

const outputSockets = {
  ApiConfiguration: generateSocket({
    "x-key": "ApiConfiguration",
    name: "api" as const,
    title: "Api Configuration",
    type: "ApiConfiguration" as const,
    description: dedent`
    Api configuration
    `,
    required: true,
    isMultiple: false,
    "x-showSocket": true,
  }),
  config: generateSocket({
    "x-key": "config",
    name: "config" as const,
    title: "Config",
    type: "object",
    description: dedent`
    Ollama config
    `,
    required: true,
    isMultiple: false,
    "x-showSocket": true,
  }),
};

export const ApiConfigurationMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgEMAHASwFoBjLDAMxKgFcAnAgFxOvxCK1hPc5IQAD0QBGAEzoAnuInIFyIA */
    id: "api-configuration",
    context: ({ input }) => {
      const defaultInputs: (typeof input)["inputs"] = {};
      for (const [key, socket] of Object.entries(inputSockets)) {
        const inputKey = key as keyof typeof inputSockets;
        if (socket.default) {
          defaultInputs[inputKey] = socket.default as any;
        } else {
          defaultInputs[inputKey] = undefined;
        }
      }
      return merge<typeof input, any>(
        {
          inputs: {
            ...defaultInputs,
          },
          outputs: {
            config: {
              ...defaultInputs,
            },
          },
          inputSockets: {
            ...inputSockets,
          },
          outputSockets: {
            ...outputSockets,
          },
        },
        input,
      );
    },
    entry: enqueueActions(({ enqueue, check }) => {
      enqueue("assignParent");
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
      events: {
        type: "UPDATE_OUTPUTS";
      };
      actors: None;
      guards: None;
    }>,
    on: {
      ASSIGN_CHILD: {
        actions: enqueueActions(({ enqueue }) => {
          enqueue("assignChild");
        }),
      },
      UPDATE_CHILD_ACTORS: {
        actions: enqueueActions(({ enqueue }) => {
          enqueue("spawnInputActors");
        }),
      },
      SET_VALUE: {
        actions: enqueueActions(({ enqueue, event, check }) => {
          enqueue("setValue");
          enqueue("updateOutput");

          if (check(({ event }) => has(event.params.values, "APIKey"))) {
            enqueue.assign({
              inputs: ({ context, event }) => {
                const headers = { ...context.inputs.headers } as any;
                if (event.params.values["APIKey"] === "") {
                  delete headers.Authorization;
                } else {
                  headers.Authorization = `Bearer ${event.params.values["APIKey"]}`;
                }

                return {
                  ...context.inputs,
                  headers: {
                    ...headers,
                  },
                };
              },
            });
          }
        }),
      },
      UPDATE_SOCKET: {
        actions: "updateSocket",
      },
    },
  },
  {
    actions: {
      updateOutput: enqueueActions(({ enqueue, context }) => {
        enqueue.assign({
          outputs: ({ context }) => {
            return {
              config: {
                ...context.inputs,
              },
            };
          },
        });
        const connections = context.outputSockets.config["x-connection"];
        for (const [target, conn] of Object.entries(connections || {})) {
          enqueue({
            type: "syncConnection",
            params: {
              nodeId: target,
              outputKey: "config",
              inputKey: conn.key,
            },
          });
        }
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
    this.setup();
  }
}
