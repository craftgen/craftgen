"use server";
import { db, eq, nodeData } from "@seocraft/supabase/db";
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

export const getNodeData = async (nodeId: string) => {
  return await db.query.nodeData.findFirst({
    where: (nodeData, { eq }) => eq(nodeData.id, nodeId),
  });
};

export const setNodeData = async (nodeId: string, state: any) => {
  return await db
    .update(nodeData)
    .set({ state: JSON.parse(state) })
    .where(eq(nodeData.id, nodeId));
};
