import { createMachine } from "xstate";
import { BaseNode, NodeData } from "./base";
import { DiContainer } from "../editor";
import { ClassicPreset } from "rete";
import { stringSocket, triggerSocket } from "../sockets";
import { ArticleControl } from "../ui/control/control-editor";

const ArticleNodeMachine = createMachine({
  id: "articleNode",
});

export class Article extends BaseNode<typeof ArticleNodeMachine> {
  static ID: "article";

  constructor(di: DiContainer, data: NodeData<typeof ArticleNodeMachine>) {
    super("article", di, data, ArticleNodeMachine, {
      actions: {},
    });

    this.addInput("save", new ClassicPreset.Input(triggerSocket, "Save"));
    this.addOutput(
      "trigger",
      new ClassicPreset.Output(triggerSocket, "Trigger")
    );
    this.addInput(
      "append",
      new ClassicPreset.Input(stringSocket, "Append", true)
    );
    this.addControl("article", new ArticleControl("article", {}));
  }

  execute() {}

  data() {}

  async serialize() {
    return {};
  }
}
