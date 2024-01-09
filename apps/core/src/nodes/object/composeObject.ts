import { merge } from "lodash-es";
import type { JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";
import { match, P } from "ts-pattern";
import type { SetOptional } from "type-fest";
import { assign, createMachine, enqueueActions } from "xstate";

import type {
  JSONSocket} from "../../controls/socket-generator";
import {
  generateSocket,
  SocketGeneratorControl,
} from "../../controls/socket-generator";
import { slugify } from "../../lib/string";
import type { DiContainer } from "../../types";
import { createJsonSchema } from "../../utils";
import type { BaseMachineTypes, None} from "../base";
import { BaseNode  } from "../base";
import type {ParsedNode} from "../base";

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
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        name: "new_object",
        description: "object description",
        inputs: {},
        outputs: {
          schema: {
            name: "new_object",
            description: "object description",

            schema: createJsonSchema({}),
          },
        },
        inputSockets: {},
        outputSockets: {
          ...outputSockets,
        },
      },
      input,
    ),
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
  states: {
    idle: {
      // entry: ["updateAncestors"],
      on: {
        UPDATE_SOCKET: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue("updateSocket");
          }),
        },
        CONFIG_CHANGE: {
          target: "editing",
        },
        SET_VALUE: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue("setValue");
            enqueue("updateOutputObject");
          }),
        },
      },
    },
    editing: {
      entry: ["updateConfig"],
      on: {
        CONFIG_CHANGE: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue("updateConfig");
            enqueue("updateOutputObject");
          }),
          target: "editing",
          reenter: true,
        },
        SET_VALUE: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue("setValue");
            enqueue("updateOutputObject");
          }),
        },
      },
      after: {
        100: "idle",
      },
    },
  },
});

export type ComposeObjectData = ParsedNode<
  "ComposeObject",
  typeof composeObjectMachine
>;

export class ComposeObject extends BaseNode<typeof composeObjectMachine> {
  static nodeType = "ComposeObject" as const;
  static label = "Compose Object";
  static description = "Compose an object";
  static icon = "braces";

  static parse(
    params: SetOptional<ComposeObjectData, "type">,
  ): ComposeObjectData {
    return {
      ...params,
      type: "ComposeObject",
    };
  }

  constructor(di: DiContainer, data: ComposeObjectData) {
    super("ComposeObject", di, data, composeObjectMachine, {
      actions: {
        updateOutputObject: assign({
          outputs: ({ context }) => ({
            ...context.outputs,
            object: context.inputs,
          }),
        }),
        updateConfig: assign({
          inputSockets: ({ event }) =>
            match(event)
              .with(
                { type: "CONFIG_CHANGE" },
                ({ inputSockets }) => inputSockets,
              )
              .run(),
          name: ({ event }) =>
            match(event)
              .with({ type: "CONFIG_CHANGE" }, ({ name }) => name)
              .run(),
          description: ({ event }) =>
            match(event)
              .with({ type: "CONFIG_CHANGE" }, ({ description }) => description)
              .run(),
          schema: ({ event }: any) =>
            match(event)
              .with({ type: "CONFIG_CHANGE" }, ({ schema }) => schema)
              .run(),
          outputs: ({ context, event }) =>
            match(event)
              .with(
                {
                  type: "CONFIG_CHANGE",
                  name: P.string,
                  description: P.string,
                },
                ({ schema }) => ({
                  object: context.inputs,
                  schema: {
                    name: slugify(event.name, "_"),
                    description: event.description,
                    parameters: schema,
                  },
                }),
              )
              .run(),
        }),
      },
    });

    this.setup();
    const state = this.actor.getSnapshot();
    const inputGenerator = new SocketGeneratorControl(
      this.actor,
      (s) => s.context.inputSockets,
      {
        connectionType: "input",
        name: "Input Sockets",
        ignored: ["trigger"],
        tooltip: "Add input sockets",
        initial: {
          name: state.context.name,
          description: state.context.description,
        },
        onChange: ({ sockets, name, description }) => {
          const schema = createJsonSchema(sockets);
          this.setLabel(name);
          this.actor.send({
            type: "CONFIG_CHANGE",
            name,
            description: description || "",
            inputSockets: sockets,
            schema,
          });
        },
      },
    );

    this.addControl("inputGenerator", inputGenerator);
    this.setLabel(this.snap.context.name || ComposeObject.label);
  }
}
