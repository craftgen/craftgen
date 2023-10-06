import { BaseControl } from "./base";

type InputControlOptions = {
  change: (value: string) => void;
  readonly?: boolean;
};

export class InputControl extends BaseControl {
  __type = "number";

  constructor(public value: string, public options: InputControlOptions) {
    super(50);
  }

  setValue(value: string) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
