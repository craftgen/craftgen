import {
  AutoArrangePlugin,
  ExpectedSchemes,
  Presets,
} from "rete-auto-arrange-plugin";
import ELK from "elkjs/lib/elk.bundled.js";

export class CustomArrange<
  Schemes extends ExpectedSchemes
> extends AutoArrangePlugin<Schemes> {
  elk = new ELK();
}

export const ArrangePresets = Presets;
