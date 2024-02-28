import { ClassicPreset } from "rete";
import type { Actor, AnyActor, SnapshotFrom } from "xstate";

import type { BaseControl } from "./controls/base";
import type { JSONSocket } from "./controls/socket-generator";
import type { Socket } from "./sockets";
import { socketMachine } from "./socket";

export class Input<
  T extends Actor<typeof socketMachine> = Actor<typeof socketMachine>,
  S extends Socket = Socket,
> extends ClassicPreset.Input<S> {
  declare control: BaseControl | null;

  constructor(
    socket: S,
    label: string,
    public multiple = false,
    public actor: T,
  ) {
    super(socket, label, multiple);

    this.actor.subscribe((snapshot) => {
      if (snapshot.context.definition.isMultiple) {
        this.multiple = snapshot.context.definition.isMultiple;
      }
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
