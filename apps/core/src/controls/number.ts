import { action, makeObservable, observable, reaction } from "mobx";
import { JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";

import { BaseControl } from "./base";

type NumberControlOptions = {
  max?: number;
  min?: number;
  change: (value: number) => void;
};

export class NumberControl extends BaseControl {
  __type = "number";
  public value: number;

  constructor(
    public observableSource: () => number, // Function that returns the observable value
    public options: NumberControlOptions,
    public readonly defination?: JSONSchemaDefinition,
  ) {
    super(50);

    this.value = observableSource(); // Set the initial value
    makeObservable(this, {
      value: observable.ref,
      setValue: action,
    });

    reaction(
      () => this.observableSource(),
      (newValue) => {
        if (newValue !== this.value) {
          console.log(
            "reaction in number controller value is not matching",
            newValue,
          );
          this.setValue(newValue);
        }
      },
    );
  }

  setValue(value: number) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
