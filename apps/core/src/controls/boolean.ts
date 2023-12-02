import { action, makeObservable, observable, reaction } from "mobx";

import { BaseControl } from "./base";
import { JSONSocket } from "./socket-generator";

type BooleanControlOptions = {
  change: (value: boolean) => void;
  readonly?: boolean;
};

export class BooleanControl extends BaseControl {
  __type = "boolean";
  public value: boolean;

  constructor(
    public observableSource: () => boolean, // Function that returns the observable value
    public options: BooleanControlOptions,
    public readonly definition?: JSONSocket,
  ) {
    super(50, definition);
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
  setValue(value: boolean) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
