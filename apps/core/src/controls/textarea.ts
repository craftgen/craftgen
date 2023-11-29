import { action, makeObservable, observable, reaction } from "mobx";
import { JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";

import { BaseControl } from "./base";

type TextareControlOptions = {
  readonly?: boolean;
  change: (value: string) => void;
};

export class TextareControl extends BaseControl {
  __type = "textarea";
  public value: string;

  constructor(
    public observableSource: () => string, // Function that returns the observable value
    public options: TextareControlOptions,
    public readonly defination?: JSONSchemaDefinition,
  ) {
    super(70, defination);

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
            "reaction in textarea controller value is not matching",
            newValue,
          );
          this.value = newValue;
        }
      },
    );
  }

  setValue(value: string) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
