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
  height = 200;
  width = 180;

  static ID: "text";
  private di?: DiContainer;

  constructor(di: DiContainer, data: Data) {
    super("Text");
    this.di = di;
    this.addControl(
      "value",
      new ClassicPreset.InputControl("text", {
        initial: data.value,
        change(value) {
          di.dataFlow?.reset();
          di.editor.getNodes().forEach((n) => {
            di.dataFlow?.fetch(n.id);
          });
        },
      })
    );
    this.addOutput(
      "value",
      new ClassicPreset.Output(new TextSocket(), "Value")
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
