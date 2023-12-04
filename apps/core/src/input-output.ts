import { ClassicPreset } from "rete";
import { AnyActor, SnapshotFrom } from "xstate";

import { JSONSocket } from "./controls/socket-generator";
import { Socket } from "./sockets";

export class Input<
  T extends AnyActor = AnyActor,
  S extends Socket = Socket,
> extends ClassicPreset.Input<S> {
  constructor(
    socket: S,
    name: string,
    multiple = false,
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => JSONSocket, // Function that returns the observable value
  ) {
    super(socket, name, multiple);
  }
}

export class Output<S extends Socket> extends ClassicPreset.Output<S> {
  constructor(
    socket: S,
    name: string,
    multiple = true,
    public showSocket = true,
  ) {
    super(socket, name, multiple);
  }
}
