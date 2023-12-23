import ky from "ky";
import { merge } from "lodash-es";
import { SetOptional } from "type-fest";
import { createMachine, enqueueActions, fromPromise, log } from "xstate";

import { DiContainer } from "../../types";
import { BaseNode, ParsedNode } from "../base";

const OllamaApi = ky.create({
  prefixUrl: "http://127.0.0.1:11434/api",
  hooks: {
    beforeRequest: [
      (request) => {
        request.headers.set("X-Requested-With", "ky");
      },
    ],
  },
});

const getModels = fromPromise(async () => {
  const models = await OllamaApi.get("tags");
  return models.json();
});

export const OllamaModelMachine = createMachine({
  id: "ollama-model",
  context: (input) => merge({}, input),
  initial: "idle",
  states: {
    idle: {
      invoke: {
        src: "getModels",
        onDone: {
          actions: enqueueActions(({ enqueue }) => {
            // console.log("enqueue", enqueue(log()));
          }),
        },
      },
    },
    running: {},
  },
});

export type OllamaModelNode = ParsedNode<"Ollama", typeof OllamaModelMachine>;

export class Ollama extends BaseNode<typeof OllamaModelMachine> {
  static nodeType = "Ollama";
  static label = "Ollama";
  static description = "Local Ollama model";

  static icon = "ollama";

  static parse = (params: SetOptional<OllamaModelNode, "type">) => {
    return {
      ...params,
      type: "Ollama",
    };
  };

  constructor(di: DiContainer, data: OllamaModelNode) {
    super("Ollama", di, data, OllamaModelMachine, {});
    this.extendMachine({
      actors: {
        getModels,
      },
    });
    this.setup();
  }
}
