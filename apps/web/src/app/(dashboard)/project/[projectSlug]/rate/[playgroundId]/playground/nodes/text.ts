import { ClassicPreset } from "rete";
import { TextSocket } from "../sockets";

export class TextNode extends ClassicPreset.Node<
  {},
  { value: ClassicPreset.Socket },
  { value: ClassicPreset.InputControl<"text"> }
> {
  height = 120;
  width = 180;
  
  __type = "Text";

  constructor(initial: string) {
    super("Text");
    this.addControl(
      "value",
      new ClassicPreset.InputControl("text", { initial })
    );
    this.addOutput(
      "value",
      new ClassicPreset.Output(new TextSocket(), "Number")
    );
  }

  execute() {}

  data(): { value: string } {
    return {
      value: this.controls.value.value || "",
    };
  }
}
