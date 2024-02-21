import type { AnyActorRef, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";

interface TextareControlOptions {
  readonly?: boolean;
  change: (value: string) => void;
}

export class TextareControl<
  T extends AnyActorRef = AnyActorRef,
> extends BaseControl {
  __type = "textarea";

  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => string, // Function that returns the observable value
    public options: TextareControlOptions,
    public readonly definition?: JSONSocket,
  ) {
    super(70, definition, actor);
  }

  setValue(value: string) {
    if (this.options?.change) this.options.change(value);
  }
}
