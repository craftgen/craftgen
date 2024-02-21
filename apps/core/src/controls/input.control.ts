import type { AnyActorRef, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";

interface InputControlOptions {
  change: (value: string) => void;
  readonly?: boolean;
}

export class InputControl<
  T extends AnyActorRef = AnyActorRef,
> extends BaseControl {
  __type = "text";

  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => string, // Function that returns the observable value
    public definitionSelector: (snapshot: SnapshotFrom<T>) => JSONSocket,
    public options: InputControlOptions,
    public definition: JSONSocket,
  ) {
    super(50, definition, actor);
  }

  setValue(value: string) {
    if (this.options?.change) this.options.change(value);
  }
}
