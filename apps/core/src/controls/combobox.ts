import type { AnyActor, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";

export interface ComboboxControlOptions<U extends string> {
  placeholder?: string;
  dataKey?: string;
  change: (value: U) => void;
  dataFetch?: () => Promise<U[]>;
  dataTransform?: (data: U[]) => { key: string; value: string }[];
  values: { key: U; value: string }[];
}

export class ComboboxControl<
  Data,
  T extends AnyActor = AnyActor,
> extends BaseControl {
  __type = "combobox";

  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => string, // Function that returns the observable value
    public options: ComboboxControlOptions<string>,
    public readonly definition?: JSONSocket,
  ) {
    super(55);
  }

  setValue(value: string) {
    if (this.options.change) this.options.change(value);
  }
}
