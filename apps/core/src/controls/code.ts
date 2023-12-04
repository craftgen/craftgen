import { AnyActor, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";
import { JSONSocket } from "./socket-generator";

export type CodeControlOptions = {
  change: (value: string) => void;
  theme?: string;
  language?: string;
};

export class CodeControl<T extends AnyActor = AnyActor> extends BaseControl {
  __type = "code";

  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => string, // Function that returns the observable value
    public options: CodeControlOptions,
    public definition: JSONSocket,
  ) {
    super(200);
  }

  setValue(value: string) {
    if (this.options?.change) this.options.change(value);
  }
}
