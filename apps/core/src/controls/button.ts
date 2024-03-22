import type { ActorRefFrom, AnyActorRef, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";
import { inputSocketMachine } from "../input-socket";

export interface ButtonControlOptions {
  disabled?: boolean;
  onClick?: () => void;
}

export class ButtonControl<
  T extends ActorRefFrom<typeof inputSocketMachine> = ActorRefFrom<
    typeof inputSocketMachine
  >,
> extends BaseControl {
  __type = "ButtonControl";

  constructor(
    public actor: T,
    public definition: JSONSocket,
  ) {
    super(50);
  }
}
