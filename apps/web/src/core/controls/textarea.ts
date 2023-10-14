import { BaseControl } from "./base";

type TextareControlOptions = {
  readonly?: boolean;
  change: (value: string) => void;
};

export class TextareControl extends BaseControl {
  __type = "textarea";

  constructor(public value: string, public options: TextareControlOptions) {
    super(70);
  }

  setValue(value: string) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
