import { action, makeObservable, observable, reaction } from "mobx";
import { JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";

import { BaseControl } from "./base";

export type SliderControlOptions = {
  max: number;
  min: number;
  step?: number;
  change: (value: number) => void;
};

export class SliderControl extends BaseControl {
  __type = "slider";

  public value: number;

  get step(): number {
    // Helper function to find the decimal place count
    function decimalPlaceCount(value: number): number {
      if (!isFinite(value)) return 0;
      let e = 1,
        p = 0;
      while (Math.round(value * e) / e !== value) {
        e *= 10;
        p++;
      }
      return p;
    }

    // Determine the decimal places for min and max
    const minDecimals = decimalPlaceCount(this.options.min);
    const maxDecimals = decimalPlaceCount(this.options.max);

    // Use the highest decimal count as the step size
    const step = Math.pow(10, -Math.max(minDecimals, maxDecimals));
    return step;
  }

  constructor(
    public observableSource: () => number,
    public options: SliderControlOptions,
    public readonly definition?: JSONSchemaDefinition,
  ) {
    super(55, definition);

    this.value = observableSource(); // Set the initial value
    makeObservable(this, {
      value: observable.ref,
      setValue: action,
    });

    reaction(
      () => this.observableSource(),
      (newValue) => {
        if (newValue && this.value !== newValue) {
          console.log(
            "reaction in input controller value is not matching",
            newValue,
          );
          this.value = newValue;
        }
      },
    );
  }

  setValue(value: number) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
