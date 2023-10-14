import { BaseControl } from "./base";

type NumberControlOptions = {
  max?: number;
  change: (value: number) => void;
};

export class NumberControl extends BaseControl {
  __type = "number";

  constructor(public value: number, public options: NumberControlOptions) {
    super(50);
  }

  setValue(value: number) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
