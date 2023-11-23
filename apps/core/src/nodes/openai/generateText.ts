import { merge, omit } from "lodash-es";
import {
  generateText,
  OpenAIApiConfiguration,
  OpenAIChatModel,
  OpenAIChatSettings,
  retryWithExponentialBackoff,
  throttleMaxConcurrency,
} from "modelfusion";
import { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise, PromiseActorLogic } from "xstate";

import { JSONSocket } from "../../controls/socket-generator";
import { Input, Output } from "../../input-output";
import { MappedType, triggerSocket } from "../../sockets";
import { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, ParsedNode } from "../base";

const inputSockets = [
  {
    name: "system" as const,
    type: "string" as const,
    description: "System Message",
    required: false,
    isMultiple: false,
  },
  {
    name: "user" as const,
    type: "string" as const,
    description: "User Prompt",
    required: true,
    isMultiple: false,
  },
];

const outputSockets = [
  {
    name: "result" as const,
    type: "string" as const,
    description: "Result",
    required: true,
    isMultiple: true,
  },
];

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
        inputSockets: inputSockets as JSONSocket[],
        outputSockets: outputSockets as JSONSocket[],
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
      action: {
        inputs: ReturnType<typeof generateTextActor>['start'];
      };
      settings: {
        openai: OpenAIChatSettings;
      };
    };
    actions: {
      type: "R";
    };
    events: {
      type: "R";
    };
    actors: {
      id: "generateText";
      src: "generateText";
      logic: ReturnType<typeof generateTextActor>;
    };
  }>,
  initial: "idle",
  states: {
    idle: {
      on: {
        // CONFIG_CHANGE: {
        //   actions: assign({
        //     settings: ({ context, event }) => mergeSettings(context, event),
        //   }),
        // },
        RUN: {
          target: "running",
        },
        SET_VALUE: {
          actions: ["setValue"],
        },
      },
    },
    running: {
      entry: [
        assign({
          action: ({ context }) => ({
            inputs: {
              openai: context.settings.openai,
              system: context.inputs.system,
              user: context.inputs.user,
            },
          }),
        }),
      ],
      invoke: {
        src: "generateText",
        input: ({ context }) => {

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
        // CONFIG_CHANGE: {
        //   actions: assign({
        //     settings: ({ context, event }) => mergeSettings(context, event),
        //   }),
        // },
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

const generateTextActor = ({ api }: { api: () => OpenAIApiConfiguration }) =>
  fromPromise(
    async ({
      input,
    }: {
      input: {
        openai: OpenAIChatSettings;
        system: string;
        user: string;
      };
    }) => {
      const text = await generateText(
        new OpenAIChatModel({
          api: api(),
          ...input.openai,
        }).withChatPrompt(),
        [
          {
            system: input.system,
          },
          {
            user: input.user,
          },
        ],
      );
      console.log({ text });
      return {
        result: text,
      };
    },
  );

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
    this.addInput("trigger", new Input(triggerSocket, "Exec", true));
    this.addOutput("trigger", new Output(triggerSocket, "Exec"));
  }
}
