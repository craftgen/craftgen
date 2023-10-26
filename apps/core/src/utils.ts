import { ClassicPreset, NodeEditor, NodeId } from "rete";
import { Sockets } from "./sockets";
import { Schemes } from "./types";
import { JSONSocket } from "./controls/socket-generator";

type Input = ClassicPreset.Input<Sockets>;
type Output = ClassicPreset.Output<Sockets>;

export function getInputNodes(editor: NodeEditor<Schemes>) {
  return editor.getNodes().filter((node) => node.ID === "InputNode");
}

export function getConnectionSockets<Scheme extends Schemes>(
  editor: NodeEditor<Scheme>,
  connection: Scheme["Connection"]
) {
  const source = editor.getNode(connection.source);
  const target = editor.getNode(connection.target);

  const output =
    source &&
    (source.outputs as Record<string, Input>)[connection.sourceOutput];
  const input =
    target && (target.inputs as Record<string, Output>)[connection.targetInput];

  return {
    source: output?.socket,
    target: input?.socket,
  };
}

export async function removeConnections(
  editor: NodeEditor<Schemes>,
  nodeId: NodeId
) {
  for (const c of [...editor.getConnections()]) {
    if (c.source === nodeId || c.target === nodeId) {
      await editor.removeConnection(c.id);
    }
  }
}

export const createJsonSchema = (inputs: JSONSocket[]) => {
  const socketToProperty = (input: JSONSocket) => ({
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
