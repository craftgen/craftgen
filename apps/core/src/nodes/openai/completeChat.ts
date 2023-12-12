import dedent from "dedent";
import { OPENAI_CHAT_MODELS } from "modelfusion";
import { generateSocket } from "../../controls/socket-generator";
import { createMachine } from "xstate";

const inputSockets = {
  system: generateSocket({
    name: "system" as const,
    type: "string" as const,
    description: "System Message",
    required: false,
    isMultiple: false,
    "x-controller": "textarea",
    title: "System Message",
    "x-showSocket": true,
    "x-key": "system",
  }),
  model: generateSocket({
    "x-key": "model",
    name: "model" as const,
    title: "Model",
    type: "string" as const,
    allOf: [
      {
        enum: Object.keys(OPENAI_CHAT_MODELS),
        type: "string" as const,
      },
    ],
    "x-controller": "select",
    default: "gpt-3.5-turbo-1106",
    description: dedent`
    The model to use for generating text. You can see available models
    `,
  }),
};

const outputSockets = {};

const OpenAICompleteChatMachine = createMachine({
  id: "openai-complete-chat",
  
})
