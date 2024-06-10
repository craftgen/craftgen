import { ActorRefFrom } from "xstate";

import { inputSocketMachine } from "../input-socket";
import { BaseControl } from "./base";
import { JSONSocket } from "./socket-generator";

export class JsCdnController<
  T extends ActorRefFrom<typeof inputSocketMachine> = ActorRefFrom<
    typeof inputSocketMachine
  >,
> extends BaseControl {
  __type = "js-cdn";
  constructor(
    public actor: T,
    public definition?: JSONSocket,
  ) {
    super(300, definition, actor);
  }
}
