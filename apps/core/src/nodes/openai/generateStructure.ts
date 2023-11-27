import { merge } from "lodash-es";
import {
  generateStructure,
  openai,
  OpenAIApiConfiguration,
  OpenAIChatMessage,
  OpenAIChatSettings,
  retryWithExponentialBackoff,
  throttleMaxConcurrency,
  UncheckedStructureDefinition,
} from "modelfusion";
import { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise } from "xstate";

import { OpenAIChatSettingsControl } from "../../controls/openai-chat-settings";
import { JSONSocket } from "../../controls/socket-generator";
import { Input, Output } from "../../input-output";
import { MappedType, Tool, triggerSocket } from "../../sockets";
import { DiContainer } from "../../types";
import { BaseMachineTypes, BaseNode, ParsedNode } from "../base";

/**
 * @type {JSONSocket[]}
 */
const inputSockets = [
  {
    name: "system" as const,
    type: "string" as const,
    description: "System Message",
    required: false,
    isMultiple: false,
    "x-controller": "textarea",
  },
  {
    name: "user" as const,
    type: "string" as const,
    description: "User Prompt",
    required: true,
    isMultiple: false,
    "x-controller": "textarea",
  },
  {
    name: "schema" as const,
    type: "tool" as const,
    description: "Schema",
    required: true,
    isMultiple: false,
    "x-controller": "socket-generator",
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

const OpenAIGenerateStructureMachine = createMachine({
  id: "openai-generate-structure",
  context: ({ input }) =>
    merge<typeof input, any>(
      {
        inputs: {
          schema: {
            name: "",
            description: "",
            schema: {},
          },
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
      logic: ReturnType<typeof generateStructureActor>;
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
        src: "generateStructure",
        input: ({ context }): GenerateStructureInput => {
          return {
            openai: context.settings.openai,
            system: context.inputs.system,
            user: context.inputs.user,
            schema: context.inputs.schema,
          };
        },
        onDone: {
          target: "#openai-generate-structure.complete",
          actions: assign({
            outputs: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "#openai-generate-structure.error",
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

export type OpenAIGenerateStructureNode = ParsedNode<
  "OpenAIGenerateStructure",
  typeof OpenAIGenerateStructureMachine
>;

type GenerateStructureInput = {
  openai: OpenAIChatSettings;
  system: string;
  user: string;
  schema: Tool;
};

const generateStructureActor = ({
  api,
}: {
  api: () => OpenAIApiConfiguration;
}) =>
  fromPromise(async ({ input }: { input: GenerateStructureInput }) => {
    console.log("@@@", { input });
    const structure = await generateStructure(
      openai.ChatTextGenerator({
        api: api(),
        ...input.openai,
      }),
      new UncheckedStructureDefinition({
        name: input.schema.name,
        description: input.schema.description,
        jsonSchema: input.schema.schema,
      }),
      [
        OpenAIChatMessage.system(input.system),
        OpenAIChatMessage.user(input.user),
      ],
    );
    return {
      result: structure,
    };
  });

export class OpenAIGenerateStructure extends BaseNode<
  typeof OpenAIGenerateStructureMachine
> {
  static nodeType = "OpenAIGenerateStructure";
  static label = "Generate Structure";
  static description = "Usefull for generating structured data from a OpenAI";
  static icon = "openAI";

  static section = "OpenAI";

  static parse(
    params: SetOptional<OpenAIGenerateStructureNode, "type">,
  ): OpenAIGenerateStructureNode {
    return {
      ...params,
      type: "OpenAIGenerateStructure",
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

  constructor(di: DiContainer, data: OpenAIGenerateStructureNode) {
    super("OpenAIGenerateStructure", di, data, OpenAIGenerateStructureMachine, {
      actors: {
        generateStructure: generateStructureActor({ api: () => this.apiModel }),
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
