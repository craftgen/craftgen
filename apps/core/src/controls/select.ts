import { AnyActor, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";
import { JSONSocket } from "./socket-generator";

export type SelectControlOptions<U extends string> = {
  change: (value: U) => void;
  disabled?: boolean;
  placeholder: string;
  values: { key: U; value: string }[];
};

export class SelectControl<
  U extends string = string,
  T extends AnyActor = AnyActor,
> extends BaseControl {
  __type = "select";

  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => U, // Function that returns the observable value
    public options: SelectControlOptions<U>,
    public readonly definition?: JSONSocket,
  ) {
    super(55, definition);

    this.options.disabled = this.options.disabled ?? false;
  }

  setValue(value: U) {
    if (this.options.change) this.options.change(value);
  }
}
