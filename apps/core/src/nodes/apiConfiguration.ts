import { merge } from "lodash-es";
import dedent from "ts-dedent";
import { createMachine } from "xstate";

import { generateSocket } from "../controls/socket-generator";
import { DiContainer } from "../types";
import {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  BaseNode,
  None,
  ParsedNode,
} from "./base";

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
  }),
};

const outputSockets = {
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

export const ApiConfigurationMachine = createMachine({
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
            apiUrl: "loco",
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
    SET_VALUE: {
      actions: "setValue",
    },
    UPDATE_SOCKET: {
      actions: "updateSocket",
    },
  },
});

export type ApiConfigurationNode = ParsedNode<
  "ApiConfiguration",
  typeof ApiConfigurationMachine
>;

export class ApiConfiguration extends BaseNode<typeof ApiConfigurationMachine> {
  static title = "API Configuration";
  static label = "API Configuration";
  static description = dedent`
  The API Configuration node allows you to manage and customize your API requests.
  Here, you can set up and modify API headers, keys, and other related settings to suit your application's needs.  
  `;

  static icon = "settings";
  constructor(di: DiContainer, data: ApiConfigurationNode) {
    super("ApiConfiguration", di, data, ApiConfigurationMachine, {});
    this.setup();
  }
}
