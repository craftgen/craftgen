import { ClassicPreset } from "rete";
import { ActionSocket, TextSocket } from "../sockets";
import { CodeControl } from "../ui/control/control-code";
import { DiContainer } from "../editor";
import { BaseNode, NodeData } from "./base";

type Data = {
  schema: string;
};

export class FunctionNode extends BaseNode<
  {
    prompt: TextSocket;
    exec: ActionSocket;
  },
  { message: ClassicPreset.Socket },
  {
    schema: CodeControl;
  }
> {
  height = 420;
  width = 280;

  static ID: "start";

  constructor(di: DiContainer, data: NodeData) {
    super("Function", di, data);
    this.di = di;
    this.addControl("schema", new CodeControl(data?.schema!, "js"));
  }

  execute(_: any, forward: (output: "exec") => void) {
    forward("exec");
  }

  data() {
    return {};
  }

  serialize() {
    return {};
  }
}
