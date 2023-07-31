import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";

type Data = {
  value: string;
};

export class PromptTemplate extends ClassicPreset.Node<
  {},
  { value: ClassicPreset.Socket },
  { value: ClassicPreset.InputControl<"text"> }
> {
  height = 120;
  width = 180;

  constructor(di: DiContainer, data: Data) {
    super("Prompt Template");
    // this.addControl();
  }

  execute() {}

  data(): Data {
    return {
      value: this.controls.value.value || "",
    }
  }

  serialize(): Data {
    return {
      value: this.controls.value.value || "",
    };
  }
}
