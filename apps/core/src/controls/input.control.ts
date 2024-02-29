import type { ActorRefFrom } from "xstate";

import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";
import { inputSocketMachine } from "../input-socket";

export class InputControl<
  T extends ActorRefFrom<typeof inputSocketMachine> = ActorRefFrom<
    typeof inputSocketMachine
  >,
> extends BaseControl {
  __type = "text";

  constructor(
    public actor: T,
    public definition: JSONSocket,
  ) {
    super(50, definition, actor);
  }
}
