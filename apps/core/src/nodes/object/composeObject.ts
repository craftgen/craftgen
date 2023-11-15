import { merge } from "lodash-es";
import { match } from "ts-pattern";
import { SetOptional } from "type-fest";
import {
  assign,
  ContextFrom,
  createMachine,
  EventFrom,
  fromPromise,
  InferEvent,
} from "xstate";

import {
  JSONSocket,
  SocketGeneratorControl,
} from "../../controls/socket-generator";
import { Output } from "../../input-output";
import { objectSocket } from "../../sockets";
import { DiContainer } from "../../types";
import { createJsonSchema } from "../../utils";
import { BaseMachineTypes, BaseNode, type ParsedNode } from "../base";

const composeObjectMachine = createMachine({
  id: "composeObject",
  initial: "idle",
  context: ({ input }) =>
    merge(
      {
        name: "new_object",
        description: "object description",
        inputs: {},
        outputs: {},
        inputSockets: [],
        outputSockets: [],
        schema: {},
        error: null,
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      name: string;
      description?: string;
      schema: any;
    };
    context: {
      name: string;
      description: string;
      schema: object;
    };
    actions: {
      type: "updateConfig";
      params?: {
        name: string;
        description: string;
        inputSockets: JSONSocket[];
        schema: object;
      };
    };
    actors: any;
    events: {
      type: "CONFIG_CHANGE";
      name: string;
      description: string;
      inputSockets: JSONSocket[];
      schema: object;
    };
  }>,
  states: {
    idle: {
      entry: ["updateAncestors"],
      on: {
        CONFIG_CHANGE: {
          target: "editing",
        },
      },
    },
    editing: {
      entry: ["updateConfig"],
      on: {
        CONFIG_CHANGE: {
          actions: ["updateConfig"],
          target: "editing",
          reenter: true,
        },
      },
      after: {
        2000: "idle",
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
              .with({ type: "CONFIG_CHANGE" }, ({ schema }) => ({
                ...context.outputs,
                object: {},
                schema,
              }))
              .run(),
        }),
      },
      actors: {
        process: fromPromise(async ({ input }) => {
          console.log("PROCESSING", input);
          const schema = createJsonSchema(input.inputs);
          return schema;
        }),
      },
    });

    this.addOutput("object", new Output(objectSocket, "Object"));
    this.addOutput("schema", new Output(objectSocket, "Schema"));

    this.setLabel(this.snap.context.name || ComposeObject.label);
    const state = this.actor.getSnapshot();
    const inputGenerator = new SocketGeneratorControl({
      connectionType: "input",
      name: "Input Sockets",
      ignored: ["trigger"],
      tooltip: "Add input sockets",
      initial: {
        name: state.context.name,
        description: state.context.description,
        sockets: state.context.inputSockets,
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
    });

    this.addControl("inputGenerator", inputGenerator);
  }
}
