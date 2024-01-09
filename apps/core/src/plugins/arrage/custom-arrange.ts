import ELK from "elkjs/lib/elk.bundled.js";
import type {
  ExpectedSchemes} from "rete-auto-arrange-plugin";
import {
  AutoArrangePlugin,
  Presets,
} from "rete-auto-arrange-plugin";

export class CustomArrange<
  Schemes extends ExpectedSchemes,
> extends AutoArrangePlugin<Schemes> {
  elk = new ELK();
}

export const ArrangePresets = Presets;
