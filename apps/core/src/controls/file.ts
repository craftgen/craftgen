import { action, makeObservable, observable, reaction } from "mobx";
import { JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";

import { BaseControl } from "./base";

type FileControlOptions = {
  change: (value: string) => void;
};

export class FileControl extends BaseControl {
  __type = "file";

  public value: string;

  constructor(
    public observableSource: () => string, // Function that returns the observable value
    public options: FileControlOptions,
    public readonly defination?: JSONSchemaDefinition,
  ) {
    super(50, defination);

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

  setValue(value: string) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
