import { ClassicPreset } from "rete";
import type { AnyActorRef } from "xstate";

import type { JSONSocket } from "./socket-generator";

export class BaseControl extends ClassicPreset.Control {
  constructor(
    public minHeight: number,
    public definition?: JSONSocket,
    public actor?: AnyActorRef,
  ) {
    super();
  }
}
