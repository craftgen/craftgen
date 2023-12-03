import { AnyActor, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";
import { JSONSocket } from "./socket-generator";

type DateControlOptions = {
  change: (value: string | null) => void;
};

export class DateControl<T extends AnyActor = AnyActor> extends BaseControl {
  __type = "date";

  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => string, // Function that returns the observable value
    public options: DateControlOptions,
    public readonly definition?: JSONSocket,
  ) {
    super(50, definition, actor);
  }

  setValue(value: Date | null) {
    if (this.options?.change)
      this.options.change((value && value?.toISOString()) || null);
  }
}
