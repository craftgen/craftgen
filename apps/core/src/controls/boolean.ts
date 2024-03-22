import type { ActorRefFrom } from "xstate";

import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";
import { inputSocketMachine } from "../input-socket";

export class BooleanControl<
  T extends ActorRefFrom<typeof inputSocketMachine> = ActorRefFrom<
    typeof inputSocketMachine
  >,
> extends BaseControl {
  __type = "boolean";

  constructor(
    public actor: T,
    public readonly definition?: JSONSocket,
  ) {
    super(50, definition);
  }
}
