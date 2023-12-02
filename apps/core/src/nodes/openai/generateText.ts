import { merge } from "lodash-es";
import {
  generateText,
  openai,
  OpenAIApiConfiguration,
  OpenAIChatMessage,
  OpenAIChatSettings,
  retryWithExponentialBackoff,
  throttleMaxConcurrency,
} from "modelfusion";
import { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise } from "xstate";

import { OpenAIChatSettingsControl } from "../../controls/openai-chat-settings";
import { Input, Output } from "../../input-output";
import { MappedType, triggerSocket } from "../../sockets";
import { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, ParsedNode } from "../base";

const inputSockets = {
  system: {
    name: "system" as const,
    type: "string" as const,
    description: "System Message",
    required: false,
    isMultiple: false,
    "x-controller": "textarea",
    title: "System Message",
  },
  user: {
    name: "user" as const,
    type: "string" as const,
    description: "User Prompt",
    required: true,
    isMultiple: false,
    "x-controller": "textarea",
  },
};

const outputSockets = {
  result: {
    name: "result" as const,
    type: "string" as const,
    description: "Result of the generation",
    required: true,
    isMultiple: true,
  },
};

const OpenAIGenerateTextMachine = createMachine({
  id: "openai-generate-text",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        inputs: {
          system: "",
          user: "",
        },
        outputs: {
          result: "",
        },
        inputSockets,
        outputSockets,
        settings: {
          openai: {
            model: "gpt-3.5-turbo-1106",
            temperature: 0.7,
            maxCompletionTokens: 1000,
          },
        },
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      inputs: MappedType<typeof inputSockets>;
      outputs: MappedType<typeof outputSockets>;
      settings: {
        openai: OpenAIChatSettings;
      };
    };
    context: {
      inputs: MappedType<typeof inputSockets>;
      outputs: MappedType<typeof outputSockets>;
      settings: {
        openai: OpenAIChatSettings;
      };
    };
    actions: {
      type: "R";
    };
    events: {
      type: "CONFIG_CHANGE";
      openai: OpenAIChatSettings;
    };
    actors: {
      src: "generateText";
      logic: ReturnType<typeof generateTextActor>;
    };
  }>,
  initial: "idle",
  states: {
    idle: {
      on: {
        CONFIG_CHANGE: {
          actions: assign({
            settings: ({ event }) => ({
              openai: event.openai,
            }),
          }),
        },
        RUN: {
          target: "running",
          actions: ["setValue"],
        },
        SET_VALUE: {
          actions: ["setValue"],
        },
      },
    },
    running: {
      invoke: {
        src: "generateText",
        input: ({ context }): GenerateTextInput => {
          return {
            openai: context.settings.openai,
            system: context.inputs.system,
            user: context.inputs.user,
          };
        },
        onDone: {
          target: "#openai-generate-text.complete",
          actions: assign({
            outputs: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "#openai-generate-text.error",
          actions: ["setError"],
        },
      },
    },
    complete: {
      type: "final",
      output: ({ context }) => context.outputs,
    },
    error: {
      on: {
        RUN: {
          target: "running",
          actions: ["setValue"],
        },
        CONFIG_CHANGE: {
          actions: assign({
            settings: ({ event }) => ({
              openai: event.openai,
            }),
          }),
        },
        SET_VALUE: {
          actions: ["setValue"],
        },
      },
    },
  },
  output: ({ context }) => context.outputs,
});

export type OpenAIGenerateTextNode = ParsedNode<
  "OpenAIGenerateText",
  typeof OpenAIGenerateTextMachine
>;

type GenerateTextInput = {
  openai: OpenAIChatSettings;
  system: string;
  user: string;
};

const generateTextActor = ({ api }: { api: () => OpenAIApiConfiguration }) =>
  fromPromise(async ({ input }: { input: GenerateTextInput }) => {
    console.log("INPUT", input);
    try {
      const text = await generateText(
        openai.ChatTextGenerator({
          api: api(),
          ...input.openai,
        }),
        [
          OpenAIChatMessage.system(input.system),
          OpenAIChatMessage.user(input.user),
        ],
      );
      console.log("TEXT", text);
      return {
        result: text,
      };
    } catch (err) {
      console.log("EEEEEE", err);
      return {
        result: "EEEEEE",
      };
    }
  });

export class OpenAIGenerateText extends BaseNode<
  typeof OpenAIGenerateTextMachine
> {
  static nodeType = "OpenAIGenerateText";
  static label = "Generate Text";
  static description = "Usefull for generating text from a prompt";
  static icon = "openAI";

  static section = "OpenAI";

  static parse(
    params: SetOptional<OpenAIGenerateTextNode, "type">,
  ): OpenAIGenerateTextNode {
    return {
      ...params,
      type: "OpenAIGenerateText",
    };
  }

  get apiModel() {
    if (!this.di.variables.has("OPENAI_API_KEY")) {
      throw new Error("MISSING_API_KEY_ERROR: OPENAI_API_KEY");
    }
    const api = new OpenAIApiConfiguration({
      apiKey: this.di.variables.get("OPENAI_API_KEY") as string,
      throttle: throttleMaxConcurrency({ maxConcurrentCalls: 1 }),
      retry: retryWithExponentialBackoff({
        maxTries: 2,
        initialDelayInMs: 1000,
        backoffFactor: 2,
      }),
    });
    return api;
  }

  constructor(di: DiContainer, data: OpenAIGenerateTextNode) {
    super("OpenAIGenerateText", di, data, OpenAIGenerateTextMachine, {
      actors: {
        generateText: generateTextActor({ api: () => this.apiModel }),
      },
    });
    this.addControl(
      "openai",
      new OpenAIChatSettingsControl(() => this.snap.context.settings.openai, {
        change: (value) => {
          console.log("change", value);
          this.actor.send({
            type: "CONFIG_CHANGE",
            openai: value,
          });
        },
      }),
    );
    this.addInput("trigger", new Input(triggerSocket, "Exec", true));
    this.addOutput("trigger", new Output(triggerSocket, "Exec"));
  }
}
