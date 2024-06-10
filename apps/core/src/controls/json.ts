import type { ActorRefFrom } from "xstate";

import { inputSocketMachine } from "../input-socket";
import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";

export interface JsonControlOptions {
  change: (v: any) => void;
}

export class JsonControl<
  T extends ActorRefFrom<typeof inputSocketMachine> = ActorRefFrom<
    typeof inputSocketMachine
  >,
> extends BaseControl {
  __type = "json";

  constructor(
    public actor: T,
    public readonly definition?: JSONSocket,
  ) {
    super(50);
  }
}
