import { assign, createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";
import { getSocketByJsonSchemaType, objectSocket } from "../../sockets";
import { ClassicPreset } from "rete";
import {
  Socket,
  SocketGeneratorControl,
} from "../../ui/control/control-socket-generator";

const composeObjectMachine = createMachine({
  id: "composeObject",
  initial: "idle",
  types: {} as {
    context: {
      name: string;
      description?: string;
      inputs: Socket[];
    };
    events: {
      type: "change";
      name: string;
      description?: string;
      inputs: Socket[];
    };
  },
  context: {
    name: "object",
    description: "object description",
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
            name: ({ event }) => event.name,
            description: ({ event }) => event.description,
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
      initial: {
        name: state.context.name,
        description: state.context.description,
        inputs: state.context.inputs,
      },
      onChange: ({ inputs, name, description }) => {
        this.actor.send({
          type: "change",
          name,
          description,
          inputs,
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
    console.log("rawTemplate", rawTemplate);

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

    const schema = createJsonSchema(state.context.inputs);

    console.log("composer", this.inputs, state.context.inputs, schema);

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

const createJsonSchema = (inputs: Socket[]) => {
  const socketToProperty = (input: Socket) => ({
    type: input.type, // or based on input.type
    ...(input.description && { description: input.description }),
    ...(input.minLength && { minLength: input.minLength }),
    ...(input.maxLength && { maxLength: input.maxLength }),
  });

  const required = inputs
    .filter((input) => input.required)
    .map((input) => input.name);

  const properties = inputs.reduce((acc, input) => {
    acc[input.name] = socketToProperty(input);
    return acc;
  }, {} as Record<string, any>);

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
    $schema: "http://json-schema.org/draft-07/schema#",
  };
};
