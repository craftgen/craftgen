import { AnyActor, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";
import { JSONSocket } from "./socket-generator";

type FileControlOptions = {
  change: (value: string) => void;
};

export class FileControl<T extends AnyActor = AnyActor> extends BaseControl {
  __type = "file";

  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => string, // Function that returns the observable value
    public options: FileControlOptions,
    public readonly definition?: JSONSocket,
  ) {
    super(50, definition);
  }

  setValue(value: string) {
    if (this.options?.change) this.options.change(value);
  }
}
