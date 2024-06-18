import { action, makeObservable, observable, reaction } from "mobx";

import { BaseControl } from "./base";

export class SWRSelectControl<T extends string, Data> extends BaseControl {
  __type = "swr-select";

  public value: T | undefined;
  constructor(
    public observableSource: () => T | undefined, // Function that returns the observable value
    public placeholder: string,
    public dataKey: string,
    public dataFetch: () => Promise<Data[]>,
    public dataTransform: (data: Data[]) => { key: T; value: string }[],
    public change?: (value: T) => void,
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

  setValue(value: T) {
    this.value = value;
    if (this.change) this.change(value);
  }
}
