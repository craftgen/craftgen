import {
  generateJson,
  generateText,
  OpenAIApiConfiguration,
  OpenAIChatChatPromptFormat,
  OpenAIChatFunctionPrompt,
  OpenAIChatMessage,
  OpenAIChatModel,
  retryWithExponentialBackoff,
  throttleMaxConcurrency,
  type OpenAIChatSettings,
} from "modelfusion";

import { turnJSONSchemaToZodSchema } from "../../lib/json-schema-to-zod";

// TODO: fix this. Can do proxy on our backend for APIS.
const getApiKeyValue = async (params: any) => {
  return {
    data: "API_KEY",
  };
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
  const { data: apiKey } = await getApiKeyValue({
    projectId,
    apiKey: "OPENAI_API_KEY",
  });
  if (!apiKey) {
    throw new Error("API Key not found");
  }
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
    OpenAIChatFunctionPrompt.forSchemaCurried([OpenAIChatMessage.user(user)]),
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
  const { data: apiKey } = await getApiKeyValue({
    projectId,
    apiKey: "OPENAI_API_KEY",
  });
  if (!apiKey) {
    throw new Error("API Key not found");
  }
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
    ],
  );
  return text;
};
