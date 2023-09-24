import { ClassicPreset } from "rete";

export type SliderControlOptions = {
  max: number;
  step: number;
  change: (value: number) => void;
};

export class SliderControl extends ClassicPreset.Control {
  __type = "slider";

  constructor(public value: number, public options: SliderControlOptions) {
    super();
  }

  setValue(value: number) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
