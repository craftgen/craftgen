import { assign, createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import {
  anySocket,
  getSocketByJsonSchemaType,
  numberSocket,
  objectSocket,
  stringSocket,
} from "../../sockets";
import { ClassicPreset } from "rete";
import {
  Socket,
  SocketGeneratorControl,
} from "../../ui/control/control-socket-generator";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

const composeObjectMachine = createMachine({
  id: "composeObject",
  initial: "idle",
  types: {} as {
    context: {
      inputs: Socket[];
    };
    events: {
      type: "change";
      inputs: Socket[];
    };
  },
  context: {
    inputs: [
      {
        name: "name",
        type: "string",
        description: "Name of the object",
      },
    ],
  },
  states: {
    idle: {
      on: {
        change: {
          target: "idle",
          actions: assign({
            inputs: ({ event }) => event.inputs,
          }),
          reenter: true,
        },
      },
    },
  },
});

export class ComposeObject extends BaseNode<typeof composeObjectMachine> {
  constructor(di: DiContainer, data: NodeData<typeof composeObjectMachine>) {
    super("Componse Object", di, data, composeObjectMachine, {});

    this.addOutput("object", new ClassicPreset.Output(objectSocket, "Object"));
    this.addOutput("schema", new ClassicPreset.Output(objectSocket, "Schema"));

    const state = this.actor.getSnapshot();
    const inputGenerator = new SocketGeneratorControl({
      connectionType: "input",
      name: "Input Sockets",
      ignored: ["trigger"],
      tooltip: "Add input sockets",
      initial: state.context.inputs,
      onChange: (sockets) => {
        this.actor.send({
          type: "change",
          inputs: sockets,
        });
      },
    });

    this.addControl("inputGenerator", inputGenerator);
    this.actor.subscribe((state) => {
      this.process();
    });
    this.process();
  }

  process() {
    const state = this.actor.getSnapshot();
    const rawTemplate = state.context.inputs as Socket[];

    for (const item of Object.keys(this.inputs)) {
      if (rawTemplate.find((i: Socket) => i.name === item)) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.target === this.id && c.targetInput === item);
      if (connections.length >= 1) continue; // if there's an input that's not in the template keep it.
      this.removeInput(item);
    }

    for (const item of rawTemplate) {
      if (this.hasInput(item.name)) {
        const input = this.inputs[item.name];
        if (input) {
          input.socket = getSocketByJsonSchemaType(item.type)!;
        }
        continue;
      }

      const socket = getSocketByJsonSchemaType(item.type)!;
      this.addInput(
        item.name,
        new ClassicPreset.Input(socket, item.name, false)
      );
    }
  }

  async execute() {}

  async data(inputs: { [key: string]: [string | number | boolean] }) {
    const state = this.actor.getSnapshot();
    const flatten = Object.entries(inputs).reduce((acc, [key, value]) => {
      const flattenValue = Array.isArray(value) ? value[0] : value;
      return {
        ...acc,
        [key]: flattenValue,
      };
    }, {});
    const zodSchema = z.object({
      name: z.string(),
      description: z.string().min(10).max(100).optional(),
    });

    const jsonSchema = zodToJsonSchema(zodSchema);

    const schema = {
      type: "object",
      properties: {
        ...state.context.inputs.reduce((acc: [], input: Socket) => {
          return {
            ...acc,
            [input.name]: {
              ...input,
            },
          };
        }, {}),
      },
    };

    console.log(
      "composer",
      this.inputs,
      state.context.inputs,
      schema,
      jsonSchema,
      zodSchema.shape
    );

    return {
      object: flatten,
      schema,
    };
  }

  serialize() {
    return {
      object: {},
    };
  }
}
