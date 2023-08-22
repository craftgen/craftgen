import { assign, createMachine } from "xstate";
import { v4 as uuidv4 } from "uuid";
import { BaseNode, NodeData } from "./base";
import { DiContainer } from "../editor";
import { ClassicPreset } from "rete";
import { stringSocket, triggerSocket } from "../sockets";
import { ArticleControl } from "../ui/control/control-editor";
import { MyValue } from "@/lib/plate/plate-types";
import { createTmpEditor } from "@/components/editor";
import { createNode } from "@udecode/plate-common";

const ArticleNodeMachine = createMachine({
  id: "articleNode",
  initial: "idle",
  types: {} as {
    context: {
      nodes: MyValue;
    };
    events: {
      type: "change";
      nodes: MyValue;
    };
  },
  context: {
    nodes: [
      {
        type: "h1",
        id: uuidv4(),
        children: [
          {
            text: "Awesome Article",
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

export class Article extends BaseNode<typeof ArticleNodeMachine> {
  static ID: "article";

  constructor(di: DiContainer, data: NodeData<typeof ArticleNodeMachine>) {
    super("article", di, data, ArticleNodeMachine, {
      actions: {},
    });

    const state = this.actor.getSnapshot();
    this.addInput("save", new ClassicPreset.Input(triggerSocket, "Save"));
    this.addOutput(
      "trigger",
      new ClassicPreset.Output(triggerSocket, "Trigger")
    );
    this.addInput(
      "append",
      new ClassicPreset.Input(stringSocket, "Append", true)
    );
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
  }

  async execute() {
    this.di.dataFlow?.reset();
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
    const node = createNode("p", inputs.append[0] || "Hello World");
    node.id = uuidv4();
    this.actor.send({
      type: "change",
      nodes: [...state.context.nodes, node],
    });

    console.log("editor", node);
  }

  data() {
    return {};
  }

  async serialize() {
    return {};
  }
}
