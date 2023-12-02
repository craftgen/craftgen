import { action, makeObservable, observable, reaction } from "mobx";

import { BaseControl } from "./base";
import { JSONSocket } from "./socket-generator";

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
    public readonly definition?: JSONSocket,
  ) {
    super(50);
    console.log("CALIFORNIA", {
      vv: observableSource(),
      observableSource,
      options,
      definition,
    });

    this.value = observableSource(); // Set the initial value
    makeObservable(this, {
      observableSource: observable.ref,
      value: observable.ref,
      setValue: action,
    });

    reaction(
      () => this.observableSource(),
      (newValue) => {
        console.log("VVVVVVV", newValue, this.value);
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
