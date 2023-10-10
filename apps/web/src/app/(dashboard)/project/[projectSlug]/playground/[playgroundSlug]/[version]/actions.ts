"use server";

import { action } from "@/lib/safe-action";
import { db } from "@seocraft/supabase/db";
import {
  OpenAIApiConfiguration,
  OpenAIChatChatPromptFormat,
  OpenAIChatFunctionPrompt,
  OpenAIChatMessage,
  OpenAIChatModel,
  OpenAIChatSettings,
  generateJson,
  generateText,
  retryWithExponentialBackoff,
  throttleMaxConcurrency,
} from "modelfusion";

const getApiKeyFromProject = async (projectId: string) => {
  const apiKey = await getApiKeyValue({
    projectId,
    apiKey: "OPENAI_API_KEY",
  });
  if (!apiKey) throw new Error("Missing API Key, `OPENAI_API_KEY`");

  return apiKey;
};

export const checkExecutionExist = action(
  z.object({ executionId: z.string() }),
  async ({ executionId }) => {
    const execution = await db.query.workflowExecution.findFirst({
      where: (workflowExecution, { eq }) =>
        eq(workflowExecution.id, executionId),
    });
    if (!execution) throw new Error("Execution not found");
    return execution;
  }
);

import * as z from "zod";
/**
 * This function converts a JSON schema into a Zod schema.
 *
 * @param schema The JSON schema to be converted. The schema should follow the JSON Schema Draft 7 specification.
 *
 * Example:
 *            schema: {
 *              $schema: "http://json-schema.org/draft-07/schema#",
 *              title: "Complex Example",
 *              type: "object",
 *              properties: {
 *                name: {
 *                  type: "string",
 *                  description: "Name of the object",
 *                  minLength: 2,
 *                  maxLength: 10,
 *                },
 *                age: {
 *                  type: "integer",
 *                  description: "Age of the object",
 *                  minimum: 0,
 *                  maximum: 120,
 *                },
 *                email: {
 *                  type: "string",
 *                  format: "email",
 *                  description: "Email of the object",
 *                },
 *                uuid: {
 *                  type: "string",
 *                  format: "uuid",
 *                  description: "UUID of the object",
 *                },
 *                isActive: {
 *                  type: "boolean",
 *                  description: "Activity status of the object",
 *                },
 *                address: {
 *                  type: "object",
 *                  description: "Address of the object",
 *                  properties: {
 *                    street: {
 *                      type: "string",
 *                    },
 *                    city: {
 *                      type: "string",
 *                    },
 *                    country: {
 *                      type: "string",
 *                    },
 *                  },
 *                  required: ["street", "city", "country"],
 *                },
 *                hobbies: {
 *                  type: "array",
 *                  description: "List of hobbies",
 *                  items: {
 *                    type: "string",
 *                  },
 *                  minItems: 1,
 *                  maxItems: 5,
 *                },
 *              },
 *              required: ["name", "age", "email", "uuid", "isActive", "address", "hobbies"],
 *              additionalProperties: false,
 *            },
 *
 * @returns A Zod schema that corresponds to the input JSON schema.
 */
const turnJSONSchemaToZodSchema = (schema: any) => {
  const zodSchema: any = {};
  Object.keys(schema.properties).forEach((key) => {
    const property = schema.properties[key];
    switch (property.type) {
      case "string":
        zodSchema[key] = property.nullable ? z.string().nullable() : z.string();
        if (property.description)
          zodSchema[key] = zodSchema[key].describe(property.description);
        if (property.minLength)
          zodSchema[key] = zodSchema[key].min(property.minLength);
        if (property.maxLength)
          zodSchema[key] = zodSchema[key].max(property.maxLength);
        if (property.format) {
          switch (property.format) {
            case "email":
              zodSchema[key] = zodSchema[key].email();
              break;
            case "uuid":
              zodSchema[key] = zodSchema[key].uuid();
              break;
            // Add other formats as needed
          }
        }
        break;
      case "number":
        zodSchema[key] = property.nullable ? z.number().nullable() : z.number();
        if (property.description)
          zodSchema[key] = zodSchema[key].describe(property.description);
        if (property.minimum)
          zodSchema[key] = zodSchema[key].min(property.minimum);
        if (property.maximum)
          zodSchema[key] = zodSchema[key].max(property.maximum);
        break;
      case "boolean":
        zodSchema[key] = property.nullable
          ? z.boolean().nullable()
          : z.boolean();
        if (property.description)
          zodSchema[key] = zodSchema[key].describe(property.description);
        break;
      case "object":
        zodSchema[key] = turnJSONSchemaToZodSchema(property);
        if (property.required) {
          property.required.forEach((requiredKey: string) => {
            if (zodSchema[key][requiredKey]) {
              zodSchema[key][requiredKey] =
                zodSchema[key][requiredKey].nonempty();
            }
          });
        }
        break;
      case "array":
        zodSchema[key] = z.array(turnJSONSchemaToZodSchema(property.items));
        if (property.description)
          zodSchema[key] = zodSchema[key].describe(property.description);
        if (property.minItems)
          zodSchema[key] = zodSchema[key].min(property.minItems);
        if (property.maxItems)
          zodSchema[key] = zodSchema[key].max(property.maxItems);
        break;
      default:
        throw new Error(`Unsupported type: ${property.type}`);
    }
  });

  // Handle required fields
  if (schema.required) {
    schema.required.forEach((requiredKey: string) => {
      if (zodSchema[requiredKey]) {
        zodSchema[requiredKey] = zodSchema[requiredKey].nonempty();
      }
    });
  }

  // Handle optional fields
  Object.keys(zodSchema).forEach((key) => {
    if (!schema.required || !schema.required.includes(key)) {
      zodSchema[key] = zodSchema[key].optional();
    }
  });

  return z.object(zodSchema);
};

export const genereteJsonFn = async ({
  projectId,
  user,
  settings,
  schema,
}: {
  projectId: string;
  user: string;
  settings: OpenAIChatSettings;
  schema: any;
}) => {
  const schemaZod = {
    name: schema.name,
    description: schema.description,
    schema: turnJSONSchemaToZodSchema(schema),
  };
  const apiKey = await getApiKeyFromProject(projectId);
  const api = new OpenAIApiConfiguration({
    apiKey: apiKey,
    throttle: throttleMaxConcurrency({ maxConcurrentCalls: 1 }),
    retry: retryWithExponentialBackoff({
      maxTries: 8,
      initialDelayInMs: 1000,
      backoffFactor: 2,
    }),
  });
  const json = await generateJson(
    new OpenAIChatModel({
      api,
      ...settings,
    }),
    schemaZod,
    OpenAIChatFunctionPrompt.forSchemaCurried([OpenAIChatMessage.user(user)])
  );
  return json;
};

export const generateTextFn = async ({
  projectId,
  user,
  settings,
}: {
  projectId: string;
  user: string;
  settings: OpenAIChatSettings;
}) => {
  const apiKey = await getApiKeyFromProject(projectId);
  const api = new OpenAIApiConfiguration({
    apiKey: apiKey,
    throttle: throttleMaxConcurrency({ maxConcurrentCalls: 1 }),
    retry: retryWithExponentialBackoff({
      maxTries: 8,
      initialDelayInMs: 1000,
      backoffFactor: 2,
    }),
  });

  const text = await generateText(
    new OpenAIChatModel({
      api,
      ...settings,
    }).withPromptFormat(OpenAIChatChatPromptFormat()),
    [
      {
        user,
      },
    ]
  );
  return text;
};

export const getApiKeyValue = async (params: {
  projectId: string;
  apiKey: string;
}): Promise<string | null> => {
  const variable = await db.query.variable.findFirst({
    where: (variable, { eq, and }) =>
      and(
        eq(variable.key, params.apiKey),
        eq(variable.project_id, params.projectId)
      ),
  });
  return variable?.value!;
};
