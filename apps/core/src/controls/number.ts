import { action, makeObservable, observable, reaction } from "mobx";
import { AnyActor, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";
import { JSONSocket } from "./socket-generator";

type NumberControlOptions = {
  max?: number;
  min?: number;
  change: (value: number) => void;
};

export class NumberControl<T extends AnyActor = AnyActor> extends BaseControl {
  __type = "number";

  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => number, // Function that returns the observable value
    public options: NumberControlOptions,
    public definition: JSONSocket,
  ) {
    super(50, definition, actor);
    console.log("CALIFORNIA", {
      selector,
      options,
      definition,
    });

    // this.value = observableSource(); // Set the initial value
    // makeObservable(this, {
    //   observableSource: observable.ref,
    //   value: observable,
    //   setValue: action,
    // });

    // reaction(
    //   () => this.observableSource(),
    //   (newValue) => {
    //     console.log("VVVVVVV", newValue, this.value);
    //     if (newValue !== this.value) {
    //       console.log(
    //         "reaction in number controller value is not matching",
    //         newValue,
    //       );
    //       this.setValue(newValue);
    //     }
    //   },
    // );
  }

  setValue(value: number) {
    // this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
