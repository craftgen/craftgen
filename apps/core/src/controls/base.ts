import { ClassicPreset } from "rete";

import { JSONSocket } from "./socket-generator";

export class BaseControl extends ClassicPreset.Control {
  constructor(
    public minHeight: number,
    definition?: JSONSocket,
  ) {
    super();
  }
}
