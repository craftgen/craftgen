import { action, makeObservable, observable, reaction } from "mobx";
import { OpenAIChatSettings } from "modelfusion";

import { BaseControl } from "./base";

type OpenAIChatSettingsControlOptions = {
  readonly?: boolean;
  change: (value: OpenAIChatSettings) => void;
};

export class OpenAIChatSettingsControl extends BaseControl {
  __type = "openai-chat-settings";
  value: OpenAIChatSettings;
  constructor(
    public observableSource: () => OpenAIChatSettings, // Function that returns the observable value
    public options: OpenAIChatSettingsControlOptions,
  ) {
    super(50);
    const initial = observableSource(); // Set the initial value
    this.value = initial;
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
  setValue(value: OpenAIChatSettings) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
