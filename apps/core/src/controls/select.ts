import { action, makeObservable, observable, reaction } from "mobx";

import { BaseControl } from "./base";

export type SelectControlOptions<T extends string> = {
  change: (value: T) => void;
  disabled?: boolean;
  placeholder: string;
  values: { key: T; value: string }[];
};

export class SelectControl<T extends string> extends BaseControl {
  __type = "select";
  public value: T | undefined;

  constructor(
    public observableSource: () => T | undefined, // Function that returns the observable value
    public options: SelectControlOptions<T>,
  ) {
    super(55);

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
            "reaction in select controller value is not matching",
            newValue,
          );
          this.value = newValue;
        }
      },
    );
    this.options.disabled = this.options.disabled ?? false;
  }

  setValue(value: T) {
    this.value = value;
    if (this.options.change) this.options.change(value);
  }
}
