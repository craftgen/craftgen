import { ClassicPreset } from "rete";
import type { AnyActor, SnapshotFrom } from "xstate";

import type { BaseControl } from "./controls/base";
import type { JSONSocket } from "./controls/socket-generator";
import type { Socket } from "./sockets";

export class Input<
  T extends AnyActor = AnyActor,
  S extends Socket = Socket,
> extends ClassicPreset.Input<S> {
  public definition: JSONSocket;

  declare control: BaseControl | null;

  constructor(
    socket: S,
    name: string,
    multiple = false,
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => JSONSocket, // Function that returns the observable value
  ) {
    super(socket, name, multiple);
    const snap = this.actor.getSnapshot();
    this.definition = this.selector(snap);

    this.actor.subscribe((snapshot) => {
      this.definition = this.selector(snapshot);
    });
  }
}

export class Output<
  T extends AnyActor = AnyActor,
  S extends Socket = Socket,
> extends ClassicPreset.Output<S> {
  public definition: JSONSocket;

  constructor(
    socket: S,
    name: string,
    multiple = true,
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => JSONSocket, // Function that returns the observable value
  ) {
    super(socket, name, multiple);
    const snap = this.actor.getSnapshot();
    this.definition = this.selector(snap);

    this.actor.subscribe((snapshot) => {
      this.definition = this.selector(snapshot);
    });
  }
}
