import type { AnyActor, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";

interface InputControlOptions {
  change: (value: string) => void;
  readonly?: boolean;
}

export class InputControl<T extends AnyActor = AnyActor> extends BaseControl {
  __type = "text";

  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => string, // Function that returns the observable value
    public options: InputControlOptions,
    public definition: JSONSocket,
  ) {
    super(50, definition, actor);
  }

  setValue(value: string) {
    console.log("Setting value", value);
    if (this.options?.change) this.options.change(value);
  }
}
