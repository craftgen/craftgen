import { createMachine, enqueueActions } from "xstate";
import { BaseNode, NodeContextFactory, ParsedNode } from "../base";
import { DiContainer } from "../../types";
import { generateSocket } from "../../controls/socket-generator";
import { SetOptional } from "type-fest";
import dedent from "ts-dedent";

const inputSockets = {
  apiConfiguration: generateSocket({
    "x-key": "apiConfiguration",
    name: "api" as const,
    title: "API Configuration",
    type: "NodeApiConfiguration",
    description: dedent`
    Api configuration for the rest api
    `,
    required: true,
    "x-actor-type": "NodeApiConfiguration",
    default: {
      baseUrl: "http://127.0.0.1:11434",
    },
    isMultiple: false,
    "x-actor-config": {
      NodeApiConfiguration: {
        connections: {
          config: "apiConfiguration",
        },
        internal: {
          config: "apiConfiguration",
        },
      },
    },
  }),
  path: generateSocket({
    name: "path",
    type: "string",
    description: "path",
    required: false,
    isMultiple: false,
    "x-showSocket": true,
    "x-key": "path",
  }),
};

const outputSockets = {
  value: generateSocket({
    name: "value",
    type: "string",
    description: "Result text",
    required: true,
    isMultiple: false,
    "x-showSocket": true,
    "x-key": "value",
    "x-controller": "textarea",
  }),
};

export const RestApiMachine = createMachine({
  id: "rest-api",
  entry: enqueueActions(({ enqueue }) => {
    enqueue("initialize");
  }),
  context: (ctx) =>
    NodeContextFactory(ctx, {
      name: "Rest API",
      description: "Rest Api",
      inputSockets,
      outputSockets,
    }),
  on: {
    ASSIGN_CHILD: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue("assignChild");
      }),
    },
    INITIALIZE: {
      actions: ["initialize"],
    },
    SET_VALUE: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue("setValue");
      }),
    },
  },
});

export type RestApiData = ParsedNode<"NodeRestApi", typeof RestApiMachine>;

export class NodeRestApi extends BaseNode<typeof RestApiMachine> {
  static nodeType = "NodeRestApi";
  static label = "REST API";
  static description = "Make a Http request to a REST API";

  // static icon = "api";

  static parse(params: SetOptional<RestApiData, "type">): RestApiData {
    return {
      ...params,
      type: "NodeRestApi",
    };
  }

  static machines = {
    NodeRestApi: RestApiMachine,
  };

  constructor(di: DiContainer, data: RestApiData) {
    super("NodeRestApi", di, data, RestApiMachine, {});
  }
}
