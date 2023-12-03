import { ClassicPreset } from "rete";
import { AnyActor } from "xstate";

import { JSONSocket } from "./socket-generator";

export class BaseControl extends ClassicPreset.Control {
  constructor(
    public minHeight: number,
    public definition?: JSONSocket,
    public actor?: AnyActor,
  ) {
    super();
  }
}
