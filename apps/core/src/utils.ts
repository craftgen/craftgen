import { NodeEditor, NodeId } from "rete";

import { JSONSocket } from "./controls/socket-generator";
import { Schemes } from "./types";

export function getInputNodes(editor: NodeEditor<Schemes>) {
  return editor.getNodes().filter((node) => node.ID === "InputNode");
}

export async function removeConnections(
  editor: NodeEditor<Schemes>,
  nodeId: NodeId,
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

  const properties = inputs.reduce(
    (acc, input) => {
      acc[input.name] = socketToProperty(input);
      return acc;
    },
    {} as Record<string, any>,
  );

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
    $schema: "http://json-schema.org/draft-07/schema#",
  };
};
