import ELK from "elkjs/lib/elk.bundled.js";
import {
  AutoArrangePlugin,
  Presets,
  type ExpectedSchemes,
} from "rete-auto-arrange-plugin";

export class CustomArrange<
  Schemes extends ExpectedSchemes,
> extends AutoArrangePlugin<Schemes> {
  elk = new ELK();
}

export const ArrangePresets = Presets;
