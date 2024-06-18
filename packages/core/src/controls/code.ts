import type { ActorRefFrom } from "xstate";

import { inputSocketMachine } from "../input-socket";
import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";

export interface CodeControlOptions {
  change: (value: string) => void;
  theme?: string;
  language?: string;
}

export class CodeControl<
  T extends ActorRefFrom<typeof inputSocketMachine> = ActorRefFrom<
    typeof inputSocketMachine
  >,
> extends BaseControl {
  __type = "code";

  constructor(
    public actor: T,
    public definition: JSONSocket,
  ) {
    super(200);
  }
}
