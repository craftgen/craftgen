import type { OpenAIChatSettings } from "modelfusion";
import type { AnyActorRef, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";

interface OpenAIChatSettingsControlOptions {
  readonly?: boolean;
  change: (value: OpenAIChatSettings) => void;
}

export class OpenAIChatSettingsControl<
  T extends AnyActorRef = AnyActorRef,
> extends BaseControl {
  __type = "openai-chat-settings";
  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => OpenAIChatSettings, // Function that returns the observable value
    public options: OpenAIChatSettingsControlOptions,
  ) {
    super(50);
  }
  setValue(value: OpenAIChatSettings) {
    if (this.options?.change) this.options.change(value);
  }
}
