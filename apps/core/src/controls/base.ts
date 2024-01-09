import { ClassicPreset } from "rete";
import type { AnyActor, AnyActorRef } from "xstate";

import type { JSONSocket } from "./socket-generator";

export class BaseControl extends ClassicPreset.Control {
  constructor(
    public minHeight: number,
    public definition?: JSONSocket,
    public actor?: AnyActor | AnyActorRef,
  ) {
    super();
  }
}
