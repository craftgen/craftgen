import { ClassicPreset } from "rete";
import type { Actor, AnyActor, SnapshotFrom } from "xstate";

import type { BaseControl } from "./controls/base";
import type { JSONSocket } from "./controls/socket-generator";
import { inputSocketMachine } from "./input-socket";
import { outputSocketMachine } from "./output-socket";
import type { Socket } from "./sockets";

export class Input<
  T extends Actor<typeof inputSocketMachine> = Actor<typeof inputSocketMachine>,
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
  T extends Actor<typeof outputSocketMachine> = Actor<
    typeof outputSocketMachine
  >,
  S extends Socket = Socket,
> extends ClassicPreset.Output<S> {
  constructor(
    socket: S,
    label: string,
    multiple = true,
    public actor: T,
  ) {
    super(socket, label, multiple);
  }
}
