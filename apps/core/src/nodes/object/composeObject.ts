import { merge, set } from "lodash-es";
import type { JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";
import { match, P } from "ts-pattern";
import type { SetOptional } from "type-fest";
import { assign, createMachine, enqueueActions } from "xstate";

import type { JSONSocket } from "../../controls/socket-generator";
import {
  generateSocket,
  SocketGeneratorControl,
} from "../../controls/socket-generator";
import { slugify } from "../../lib/string";
import type { DiContainer } from "../../types";
import { createJsonSchema } from "../../utils";
import type { BaseMachineTypes, None } from "../base";
import { BaseNode, NodeContextFactory } from "../base";
import type { ParsedNode } from "../base";
import { createId } from "@paralleldrive/cuid2";

const outputSockets = {
  object: generateSocket({
    name: "object" as const,
    type: "object" as const,
    description: "Object",
    required: true,
    isMultiple: false,
    "x-key": "object",
  }),
  schema: generateSocket({
    name: "schema" as const,
    type: "object" as const,
    description: "Schema",
    required: true,
    isMultiple: false,
    "x-key": "schema",
  }),
};

const composeObjectMachine = createMachine({
  id: "composeObject",
  initial: "idle",
  context: (ctx) =>
    NodeContextFactory(ctx, {
      name: "new_object",
      description: "object description",
      inputSockets: {},
      outputSockets,
    }),
  types: {} as BaseMachineTypes<{
    input: {
      name: string;
      description?: string;
    };
    context: {
      name: string;
      description: string;
      schema: JSONSchemaDefinition;
    };
    actors: None;
    guards: None;
    actions:
      | {
          type: "updateConfig";
          params?: {
            name: string;
            description: string;
            inputSockets: JSONSocket[];
            schema: object;
          };
        }
      | {
          type: "updateOutputObject";
        };
    events: {
      type: "CONFIG_CHANGE";
      name: string;
      description: string;
      inputSockets: JSONSocket[];
      schema: JSONSchemaDefinition;
    };
  }>,
  on: {
    ADD_SOCKET: {
      actions: "addSocket",
    },
    REMOVE_SOCKET: {
      actions: "removeSocket",
    },
    SET_VALUE: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue("setValue");
      }),
    },
  },
  invoke: [
    {
      src: "actorWatcher",
      input: ({ self }) => ({
        actor: self,
        stateSelectorPath: "context.inputs",
        event: "COMPUTE",
      }),
    },
  ],
  states: {
    idle: {
      on: {
        CONFIG_CHANGE: {
          actions: "updateConfig",
        },
        COMPUTE: {
          actions: enqueueActions(({ enqueue, context, self, event }) => {
            enqueue({
              type: "computeEvent",
              params: {
                event: "RESULT",
              },
            });
          }),
        },
        RESULT: {
          actions: enqueueActions(({ enqueue, context, event }) => {
            console.log("RESULT EVENT", context, event);

            enqueue({
              type: "removeComputation",
            });

            const schema = createJsonSchema(
              Object.values(context.inputSockets).reduce(
                (prev, inputSocketActor) => {
                  const socket = inputSocketActor.getSnapshot();
                  const definition = socket.context.definition;
                  console.log("PP", prev, definition);
                  set(prev, definition["x-key"], definition);
                  return prev;
                },
                {} as Record<string, any>,
              ),
            );

            enqueue.assign({
              outputs: ({ event }) => {
                return {
                  schema,
                  object: {
                    ...event.params.inputs,
                  },
                };
              },
            });

            enqueue("resolveOutputSockets");
          }),
        },
      },
    },
  },
});

export type ComposeObjectData = ParsedNode<
  "NodeComposeObject",
  typeof composeObjectMachine
>;

export class NodeComposeObject extends BaseNode<typeof composeObjectMachine> {
  static nodeType = "ComposeObject" as const;
  static label = "Compose Object";
  static description = "Compose an object";
  static icon = "braces";

  static parse(
    params: SetOptional<ComposeObjectData, "type">,
  ): ComposeObjectData {
    return {
      ...params,
      type: "NodeComposeObject",
    };
  }

  static machines = {
    NodeComposeObject: composeObjectMachine,
  };

  constructor(di: DiContainer, data: ComposeObjectData) {
    super("NodeComposeObject", di, data, composeObjectMachine, {
      actions: {},
    });

    this.setup();
  }
}
