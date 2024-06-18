import * as React from "react";
import type { BaseSchemes } from "rete";

import type { RenderPreset } from "../types";
import { Minimap } from "./components/Minimap";
import type { MinimapRender } from "./types";

/**
 * Preset for rendering minimap.
 */
export function setup<
  Schemes extends BaseSchemes,
  K extends MinimapRender,
>(props?: { size?: number }): RenderPreset<Schemes, K> {
  return {
    render(context) {
      if (context.data.type === "minimap") {
        return (
          <Minimap
            nodes={context.data.nodes}
            size={props?.size || 200}
            ratio={context.data.ratio}
            viewport={context.data.viewport}
            start={context.data.start}
            translate={context.data.translate}
            point={context.data.point}
          />
        );
      }
    },
  };
}
