import { createMachine, enqueueActions } from "xstate";
import { BaseNode, NodeContextFactory, ParsedNode } from "../base";
import { DiContainer } from "../../types";

export const RestApiMachine = createMachine({
  id: "rest-api",
  entry: enqueueActions(({ enqueue }) => {
    enqueue("initialize");
  }),
  context: (ctx) =>
    NodeContextFactory(ctx, {
      name: "Rest API",
      description: "Rest Api",
      inputSockets: {},
      outputSockets: {},
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
  },
});

export type RestApiNode = ParsedNode<"NodeRestApi", typeof RestApiMachine>;

export class NodeRestApi extends BaseNode<typeof RestApiMachine> {
  static nodeType = "NodeRestApi";
  static label = "REST API";
  static description = "Make a Http request to a REST API";

  static icon = "api";

  static machines = {
    NodeRestApi: RestApiMachine,
  };

  constructor(di: DiContainer, data: RestApiNode) {
    super("NodeRestApi", di, data, RestApiMachine, {});
  }
}
