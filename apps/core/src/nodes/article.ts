import { assign, createMachine } from "xstate";
import { BaseNode, type ParsedNode } from "./base";
import type { DiContainer } from "../types";
import { stringSocket, triggerSocket } from "../sockets";
import { ArticleControl } from "../controls/article";
import { Input, Output } from "../input-output";
import { SetOptional } from "type-fest";
import { createId } from "@paralleldrive/cuid2";

const ArticleNodeMachine = createMachine({
  id: "articleNode",
  initial: "idle",
  types: {} as {
    context: {
      nodes: any;
    };
    events: {
      type: "change";
      nodes: any;
    };
  },
  context: {
    nodes: [
      {
        type: "h1",
        id: createId(),
        children: [
          {
            text: "",
          },
        ],
      },
    ],
  },
  states: {
    idle: {
      on: {
        change: {
          target: "idle",
          actions: assign({
            nodes: ({ event }) => event.nodes,
          }),
          reenter: true,
        },
      },
    },
  },
});

export type ArticleData = ParsedNode<"Article", typeof ArticleNodeMachine>;
export class Article extends BaseNode<typeof ArticleNodeMachine> {
  static nodeType = "Article" as const;
  static label = "Article";
  static description = "Node for handling articles";
  static icon = "newspaper";

  static parse(params: SetOptional<ArticleData, "type">): ArticleData {
    return {
      ...params,
      type: "Article",
    };
  }

  constructor(di: DiContainer, data: ArticleData) {
    super("Article", di, data, ArticleNodeMachine, {
      actions: {},
    });

    const state = this.actor.getSnapshot();
    this.addInput("save", new Input(triggerSocket, "Save"));
    this.addOutput("trigger", new Output(triggerSocket, "Trigger"));
    this.addInput("append", new Input(stringSocket, "Append", true));
    const articleController = new ArticleControl(state.context.nodes, {
      initial: state?.context?.nodes || [],
      change: (nodes) => {
        this.actor.send({
          type: "change",
          nodes,
        });
      },
    });
    this.actor.subscribe((state) => {
      console.log("article state changed", state);
      articleController.value = state.context.nodes;
    });
    this.addControl("article", articleController);
    this.addOutput("Markdown", new Output(stringSocket, "Markdown"));

    this.addOutput("HTML", new Output(stringSocket, "HTML"));
    this.addOutput("JSON", new Output(stringSocket, "JSON"));
  }

  async execute() {
    const incomers = this.di.graph.incomers(this.id);

    incomers.nodes().forEach(async (n) => {
      await this.di.dataFlow?.fetch(n.id);
    });
    const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
      append: string[];
    };
    const state = this.actor.getSnapshot();

    console.log("Article inputs", inputs);
    // const editor = createTmpEditor();
    // const node = createNode("p", inputs.append[0] || "Hello World");
    // node.id = uuidv4();
    this.actor.send({
      type: "change",
      nodes: [
        ...state.context.nodes,
        {
          type: "p",
          id: createId(),
        },
      ],
    });

    // console.log("editor", node);
  }
}
