import type { ActorRefFrom } from "xstate";

import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";
import { inputSocketMachine } from "../input-socket";

export interface SelectControlOptions<U extends string> {
  change: (value: U) => void;
  disabled?: boolean;
  placeholder: string;
  values: { key: U; value: string }[];
}

export class SelectControl<
  T extends ActorRefFrom<typeof inputSocketMachine> = ActorRefFrom<
    typeof inputSocketMachine
  >,
> extends BaseControl {
  __type = "select";

  constructor(
    public actor: T,
    public readonly definition?: JSONSocket,
  ) {
    super(55, definition);
  }
}
