import { ActorRefFrom } from "xstate";
import { BaseControl } from "./base";
import { JSONSocket } from "./socket-generator";
import { inputSocketMachine } from "../input-socket";

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
