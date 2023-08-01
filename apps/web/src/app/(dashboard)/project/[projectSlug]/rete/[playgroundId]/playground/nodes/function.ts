import { ClassicPreset } from "rete";
import { ActionSocket, TextSocket } from "../sockets";
import { CodeControl } from "../ui/control/control-code";
import { DiContainer } from "../editor";

type Data = {
  schema: string;
};

export class FunctionNode extends ClassicPreset.Node<
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
  private di?: DiContainer;

  static ID: "start";

  constructor(di: DiContainer, data?: Data) {
    super("Function");
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
