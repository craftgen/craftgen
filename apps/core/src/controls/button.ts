import { AnyActor, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";
import { JSONSocket } from "./socket-generator";

export type ButtonControlOptions = {
  disabled?: boolean;
  onClick?: () => void;
};

export class ButtonControl<T extends AnyActor = AnyActor> extends BaseControl {
  __type = "ButtonControl";

  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => number, // Function that returns the observable value
    public options: ButtonControlOptions,
    public definition: JSONSocket,
  ) {
    super(50);
  }
}
