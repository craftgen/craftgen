import { action, makeObservable, observable, reaction } from "mobx";
import { OpenAIApiConfiguration } from "modelfusion";

import { BaseControl } from "./base";

interface OpenAIApiConfigurationControlOptions {
  readonly?: boolean;
  change: (value: OpenAIApiConfiguration) => void;
}

export class OpenAIApiConfigurationControl extends BaseControl {
  __type = "openai-api-configuration";
  public value: OpenAIApiConfiguration;
  constructor(
    public observableSource: () => OpenAIApiConfiguration, // Function that returns the observable value
    public options: OpenAIApiConfigurationControlOptions,
  ) {
    super(50);
    const initial = observableSource(); // Set the initial value
    this.value = new OpenAIApiConfiguration(initial);
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
  setValue(value: OpenAIApiConfiguration) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
