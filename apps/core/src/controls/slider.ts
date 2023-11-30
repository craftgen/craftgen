import { action, makeObservable, observable, reaction } from "mobx";
import { JSONSchema, JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";

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
    if (this.options.step) return this.options.step;
    if (this.options.max === 1 && this.options.min === 0) {
      return 0.01;
    }
    // Helper function to find the decimal place count
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

    // Determine the decimal places for min, max, and default
    const minDecimals = decimalPlaceCount(this.options.min);
    const maxDecimals = decimalPlaceCount(this.options.max);

    const defaultDecimals =
      this.definition?.default !== undefined
        ? decimalPlaceCount(Number(this.definition?.default!))
        : 0;

    console.log({
      minDecimals,
      maxDecimals,
      defaultDecimals,
    });
    // Use the highest decimal count as the step size
    const step = Math.pow(
      10,
      -Math.max(minDecimals, maxDecimals, defaultDecimals),
    );
    return step;
  }

  constructor(
    public observableSource: () => number,
    public options: SliderControlOptions,
    public readonly definition?: JSONSchema,
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
