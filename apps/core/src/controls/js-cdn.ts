import { AnyActor, SnapshotFrom } from "xstate";
import { BaseControl } from "./base";
import { JSONSocket } from "./socket-generator";

export interface JsCdnControlOptions {
  onChange: (data: string[]) => void;
}

export class JsCdnController<
  T extends AnyActor = AnyActor,
> extends BaseControl {
  __type = "js-cdn";
  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => string[], // Function that returns the observable value
    public params: JsCdnControlOptions,
    public definition?: JSONSocket,
  ) {
    super(300, definition, actor);
  }

  setValue(val: string[]) {
    this.params.onChange(val);
  }
}
