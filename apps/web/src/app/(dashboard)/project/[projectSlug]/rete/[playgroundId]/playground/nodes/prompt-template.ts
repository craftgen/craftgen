import { ClassicPreset } from "rete";
import * as Sqrl from "squirrelly";
import { DiContainer } from "../editor";
import { flatten, isString } from "lodash-es";
import { TextSocket } from "../sockets";

type Data = {
  value: string;
};

export class PromptTemplate extends ClassicPreset.Node<
  {
    [key: string]: ClassicPreset.Socket;
  },
  { value: ClassicPreset.Socket },
  {
    template: ClassicPreset.InputControl<"text">;
    rendered: ClassicPreset.InputControl<"text">;
  }
> {
  height = 420;
  width = 280;

  template: string = "";

  private di: DiContainer;

  constructor(di: DiContainer, data: Data) {
    super("Prompt Template");
    this.di = di;
    const self = this;
    this.addOutput("value", new ClassicPreset.Output(new TextSocket(), "Text"));
    this.addControl(
      "template",
      new ClassicPreset.InputControl("text", {
        initial: data.value,
        change(value) {
          self.process(value);
        },
      })
    );
    this.addControl(
      "rendered",
      new ClassicPreset.InputControl("text", {
        readonly: true,
      })
    );
    this.process(data.value);
  }

  process(value: string) {
    console.log(value);
    this.template = value;
    let rawTemplate: any[] = [];
    try {
      rawTemplate = Sqrl.parse(value, {
        ...Sqrl.defaultConfig,
        useWith: true,
      })
        .filter((item) => !isString(item))
        .map((item) => {
          return item.c;
        });
    } catch (e) {
      // console.log(e);
    }

    for (const item of Object.keys(this.inputs)) {
      if (rawTemplate.includes(item)) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.target === this.id && c.targetInput === item);
      if (connections.length >= 1) continue;
      // if (this.inputs.) continue; // if there's an input that's not in the template keep it.
      console.log("removing input", item);
      this.removeInput(item);
    }

    for (const item of rawTemplate) {
      if (this.hasInput(item)) continue;
      this.addInput(
        item,
        new ClassicPreset.Input(new TextSocket(), item, false)
      );
    }

    const values = Object.entries(this.inputs).reduce((prev, curr) => {
      const [key, value] = curr;
      prev[key] = value[0];

      return prev;
    }, {} as Record<string, string>);

    const renderedValue = Sqrl.render(this.template, values, {
      useWith: true,
    });

    this.controls.rendered.setValue(renderedValue);

    this.di.area.update("control", this.controls.rendered.id);
    this.di.dataFlow?.reset();
    this.di.editor.getNodes().forEach((n) => this.di.dataFlow?.fetch(n.id));
  }

  execute() {}

  data(inputs: { [key: string]: [string | number] }): Data {
    // console.log((inputs.message && inputs.message[0]) || "");

    // Flatten inputs
    const values = Object.entries(inputs).reduce((prev, curr) => {
      const [key, value] = curr;
      prev[key] = value[0];

      return prev;
    }, {} as Record<string, string>);

    const value = Sqrl.render(this.template, values, {
      useWith: true,
    });

    this.controls.rendered.setValue(value);
    this.di.area.update("control", value);

    return {
      value,
    };
  }

  serialize(): Data {
    return {
      value: this.controls.template.value || "",
    };
  }
}
