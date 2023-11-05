import { merge } from "lodash-es";
import { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise } from "xstate";

import {
  JSONSocket,
  SocketGeneratorControl,
} from "../../controls/socket-generator";
import { Output } from "../../input-output";
import { objectSocket } from "../../sockets";
import { DiContainer } from "../../types";
import { createJsonSchema } from "../../utils";
import { BaseActorTypes, BaseNode, type ParsedNode } from "../base";

const composeObjectMachine = createMachine({
  id: "composeObject",
  initial: "idle",
  context: ({ input }) =>
    merge(
      {
        name: "object",
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
  types: {} as BaseActorTypes<{
    input: {
      name: string;
      description?: string;
      schema: any;
    };
    context: {
      name: string;
      description: string;
      schema: any;
    };
    actions: any;
    events: {
      type: "change";
      name: string;
      description: string;
      inputSockets: JSONSocket[];
      schema: any;
    };
  }>,
  states: {
    idle: {
      on: {
        change: {
          target: "idle",
          actions: assign({
            inputSockets: ({ event }) => event.inputSockets,
            name: ({ event }) => event.name,
            description: ({ event }) => event.description,
            schema: ({ event }) => event.schema,
          }),
          reenter: true,
        },
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
        this.actor.send({
          type: "change",
          name,
          description: description || "",
          inputSockets: sockets,
          schema,
        });
      },
    });

    this.addControl("inputGenerator", inputGenerator);
  }



  async execute() {}
}
