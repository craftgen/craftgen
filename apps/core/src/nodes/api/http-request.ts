import ky from "ky";
import { createMachine, enqueueActions, fromPromise, setup } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import { DiContainer } from "../../types";
import { BaseNode, NodeContextFactory, ParsedNode } from "../base";

const inputSockets = {
  fetch: generateSocket({
    "x-key": "fetch",
    name: "fetch",
    title: "Fetch",
    type: "trigger",
    description: "Fetch",
    "x-event": "FETCH",
    required: false,
    isMultiple: false,
    "x-showSocket": true,
  }),
  method: generateSocket({
    "x-key": "method",
    name: "method",
    title: "Method",
    type: "string",
    description: "Http Method",
    allOf: [
      {
        type: "string",
        enum: ["get", "post", "put", "delete", "patch"],
      },
    ],
    required: true,
    isMultiple: false,
    "x-controller": "combobox",
    "x-showSocket": true,
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
  code: generateSocket({
    "x-key": "code",
    name: "code",
    title: "Status Code",
    type: "number",
    description: "Http Status Code",
  }),
};

export const HttpRequestMachine = createMachine(
  {
    id: "httpRequest",
    context: (ctx) =>
      NodeContextFactory(ctx, {
        name: "HTTP Request",
        description: "http request",
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
    initial: "idle",
    states: {
      idle: {
        on: {
          RUN: {
            actions: enqueueActions(({ enqueue }) => {
              enqueue.spawnChild("computeEvent", {});
            }),
          },
          EXECUTE: {},
        },
      },
    },
  },
  {
    actors: {
      fetch: fromPromise(
        async ({
          input,
        }: {
          input: {
            path: string;
            method: string;
          };
        }) => {
          const response = await ky(input.path, {
            method: input.method,
          });
          return response;
        },
      ),
    },
  },
);

export const httpRequestCall = setup({
  types: {
    input: {} as {
      senders: {
        id: string;
      }[];
      parent: {
        id: string;
      };
    },
    context: {} as {
      // inputs: type;
      outputs: null | {
        ok: boolean;
        // result: OutputFrom<typeof generateTextActor> | ToolCallError;
      };
      senders: {
        id: string;
      }[];
      parent: {
        id: string;
      };
    },
    output: {} as {
      // result: OutputFrom<typeof generateTextActor>;
      ok: boolean;
    },
  },
  actors: {
    fetch: fromPromise(
      async ({
        input,
      }: {
        input: {
          path: string;
          method: string;
        };
      }) => {
        const response = await ky(input.path, {
          method: input.method,
        });
        return response;
      },
    ),
  },
}).createMachine({
  context: ({ input }) => {
    return {
      ...input,
      inputs: {
        method: null,
        path: null,
        body: null,
      },
    };
  },
  initial: "prepare",
  states: {
    prepare: {
      entry: enqueueActions(({ enqueue, context, self }) => {
        const inputSockets = Object.values(context.inputSockets);
        for (const socket of inputSockets) {
          enqueue.sendTo(socket, {
            type: "COMPUTE",
            params: {
              targets: [self.id],
            },
          });
        }
      }),
      on: {
        FETCH: {
          target: "fetching",
          actions: ["fetch"],
        },
      },
    },
    fetching: {
      invoke: {
        src: "fetch",
        onDone: {
          target: "success",
          actions: ["success"],
        },
        onError: {
          target: "failure",
          actions: ["failure"],
        },
      },
    },
    success: {
      type: "final",
    },
    failure: {
      type: "final",
    },
  },
});

export type NodeHttpRequestData = ParsedNode<
  "NodeHttpRequest",
  typeof HttpRequestMachine
>;

export class NodeHttpRequest extends BaseNode<typeof HttpRequestMachine> {
  static nodeType = "NodeHttpRequest";
  static label = "HTTP Request";
  static description = "HTTP Request";

  static machines = {
    NodeHttpRequest: HttpRequestMachine,
  };

  constructor(di: DiContainer, data: NodeHttpRequestData) {
    super("NodeHttpRequest", di, data, HttpRequestMachine);
  }
}
