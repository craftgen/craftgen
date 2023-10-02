import { ClassicPreset } from "rete";

export class BaseControl extends ClassicPreset.Control {
  constructor(public minHeight: number) {
    super();
  }
}
