import { parseISO } from "date-fns";
import { action, makeObservable, observable, reaction } from "mobx";
import { JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";

import { BaseControl } from "./base";

type DateControlOptions = {
  change: (value: string | null) => void;
};

export class DateControl extends BaseControl {
  __type = "date";
  public value: Date | null = null;

  constructor(
    public observableSource: () => string, // Function that returns the observable value
    public options: DateControlOptions,
    public readonly definition?: JSONSchemaDefinition,
  ) {
    super(50);
    const initialValue = observableSource();
    if (initialValue) {
      this.value = parseISO(initialValue); // Set the initial value
    }
    makeObservable(this, {
      value: observable.ref,
      setValue: action,
    });

    reaction(
      () => this.observableSource(),
      (newValue) => {
        if (newValue !== this.value?.toISOString()) {
          console.log(
            "reaction in number controller value is not matching",
            newValue,
          );
          this.setValue(parseISO(newValue));
        }
      },
    );
  }

  setValue(value: Date | null) {
    this.value = value;
    if (this.options?.change)
      this.options.change((value && value?.toISOString()) || null);
  }
}
