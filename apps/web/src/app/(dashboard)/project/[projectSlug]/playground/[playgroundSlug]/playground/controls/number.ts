import { ClassicPreset } from "rete";

type NumberControlOptions = {
  max?: number;
  change: (value: number) => void;
};

export class NumberControl extends ClassicPreset.Control {
  __type = "number";

  constructor(public value: number, public options: NumberControlOptions) {
    super();
  }

  setValue(value: number) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
