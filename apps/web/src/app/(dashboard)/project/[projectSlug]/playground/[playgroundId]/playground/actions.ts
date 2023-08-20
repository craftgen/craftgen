"use server";

import {
  OPENAI_CHAT_MODELS,
  OpenAIChatChatPromptFormat,
  OpenAIChatModel,
  generateText,
} from "modelfusion";

export const generateTextFn = async ({
  model,
  system,
  user,
}: {
  model: keyof typeof OPENAI_CHAT_MODELS;
  system: string;
  user: string;
}) => {
  const text = await generateText(
    new OpenAIChatModel({
      model,
      apiKey: process.env.OPENAI_API_KEY,
      maxTokens: 1000,
    }).withPromptFormat(OpenAIChatChatPromptFormat()),
    [
      {
        system,
      },
      {
        user,
      },
    ]
  );
  return text;
};
