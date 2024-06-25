import type { JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";
import type { NodeEditor, NodeId } from "rete";

import type { JSONSocket } from "./controls/socket-generator";
import type { Schemes } from "./types";

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

export const createJsonSchema = (
  inputs: Record<string, JSONSocket>,
): JSONSchemaDefinition & {
  $schema: "http://json-schema.org/draft-07/schema#";
} => {
  const socketToProperty = (input: JSONSocket) => ({
    type: input.type, // or based on input.type
    ...(input.description && { description: input.description }),
    ...(input.minLength && { minLength: input.minLength }),
    ...(input.maxLength && { maxLength: input.maxLength }),
  });

  const required = Object.values(inputs)
    .filter((input) => input.required)
    .map((input) => input["x-key"]);

  const properties = Object.entries(inputs).reduce(
    (acc, [key, input]) => {
      acc[key] = socketToProperty(input);
      if (acc[key].type === "array") {
        acc[key].items = {
          type: "string",
        };
      }
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
