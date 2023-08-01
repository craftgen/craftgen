"use server";
import {
  OPENAI_CHAT_MODELS,
  InstructionToOpenAIChatPromptMapping,
  OpenAIChatModel,
  generateText,
} from "ai-utils.js";

export const generateTextFn = async ({
  model,
  system,
  instruction,
}: {
  model: keyof typeof OPENAI_CHAT_MODELS;
  system: string;
  instruction: string;
}) => {
  const text = await generateText(
    new OpenAIChatModel({
      model,
      apiKey: process.env.OPENAI_API_KEY,
      maxTokens: 1000,
    }).mapPrompt(InstructionToOpenAIChatPromptMapping()),
    {
      system,
      instruction,
    }
  );
  return text;
};
