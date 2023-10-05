import { BaseControl } from "./base";

export type SliderControlOptions = {
  max: number;
  step: number;
  change: (value: number) => void;
};

export class SliderControl extends BaseControl {
  __type = "slider";

  constructor(public value: number, public options: SliderControlOptions) {
    super(55);
  }

  setValue(value: number) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
