import type { ActorRefFrom } from "xstate";

import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";
import { inputSocketMachine } from "../input-socket";

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
