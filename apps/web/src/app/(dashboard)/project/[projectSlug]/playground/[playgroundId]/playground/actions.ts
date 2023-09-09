"use server";

import { db } from "@seocraft/supabase/db";
import {
  OpenAIApiConfiguration,
  OpenAIChatChatPromptFormat,
  OpenAIChatModel,
  OpenAIChatSettings,
  generateText,
  retryWithExponentialBackoff,
  throttleMaxConcurrency,
} from "modelfusion";

export const generateTextFn = async ({
  projectId,
  user,
  settings,
}: {
  projectId: string;
  user: string;
  settings: OpenAIChatSettings;
}) => {
  const apiKey = await getApiKeyValue({
    projectId,
    apiKey: "OPENAI_API_KEY",
  });
  if (!apiKey) throw new Error("Missing API Key, `OPENAI_API_KEY`");
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
