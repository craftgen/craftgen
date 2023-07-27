import { ClassicPreset } from "rete";
import { TextSocket } from "../sockets";
import { DiContainer } from "../editor";

type Data = {
  value: string;
};

export class TextNode extends ClassicPreset.Node<
  {},
  { value: ClassicPreset.Socket },
  { value: ClassicPreset.InputControl<"text"> }
> {
  height = 120;
  width = 180;

  static ID: "text";

  constructor(di: DiContainer, data: Data) {
    super("Text");
    this.addControl(
      "value",
      new ClassicPreset.InputControl("text", { initial: data.value })
    );
    this.addOutput(
      "value",
      new ClassicPreset.Output(new TextSocket(), "Number")
    );
  }

  execute() {}

  data(): Data {
    return {
      value: this.controls.value.value || "",
    };
  }

  serialize(): Data {
    return {
      value: this.controls.value.value || "",
    };
  }
}
