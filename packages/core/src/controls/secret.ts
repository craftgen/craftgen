import { ActorRefFrom } from "xstate";

import { inputSocketMachine } from "../input-socket";
import { BaseControl } from "./base";
import { JSONSocket } from "./socket-generator";

export class SecretController<
  T extends ActorRefFrom<typeof inputSocketMachine> = ActorRefFrom<
    typeof inputSocketMachine
  >,
> extends BaseControl {
  __type = "secret";
  constructor(
    public actor: T,
    public definition?: JSONSocket,
  ) {
    super(300, definition, actor);
  }
}
