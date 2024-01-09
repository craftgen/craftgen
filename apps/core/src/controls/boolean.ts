import type { AnyActor, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";

interface BooleanControlOptions {
  change: (value: boolean) => void;
  readonly?: boolean;
}

export class BooleanControl<T extends AnyActor = AnyActor> extends BaseControl {
  __type = "boolean";

  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => boolean, // Function that returns the observable value
    public options: BooleanControlOptions,
    public readonly definition?: JSONSocket,
  ) {
    super(50, definition);
  }
  setValue(value: boolean) {
    if (this.options?.change) this.options.change(value);
  }
}
