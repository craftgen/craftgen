import type { ActorRefFrom } from "xstate";

import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";
import { inputSocketMachine } from "../input-socket";

export class ComboboxControl<
  T extends ActorRefFrom<typeof inputSocketMachine> = ActorRefFrom<
    typeof inputSocketMachine
  >,
> extends BaseControl {
  __type = "combobox";

  constructor(
    public actor: T,
    public readonly definition?: JSONSocket,
  ) {
    super(55);
  }
}
