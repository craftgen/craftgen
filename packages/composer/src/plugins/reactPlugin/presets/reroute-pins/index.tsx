import * as React from "react";
import type { BaseSchemes } from "rete";
import { BaseAreaPlugin } from "rete-area-plugin";

import type { Position } from "../../types";
import type { RenderPreset } from "../types";
import { Pin } from "./Pin";
import type { PinData, PinsRender } from "./types";

interface Props {
  translate?: (id: string, dx: number, dy: number) => void;
  contextMenu?: (id: string) => void;
  pointerdown?: (id: string) => void;
}

/**
 * Preset for rendering pins.
 */
export function setup<Schemes extends BaseSchemes, K extends PinsRender>(
  props?: Props,
): RenderPreset<Schemes, K> {
  function renderPins(data: PinData, pointer: () => Position) {
    return (
      <>
        {data.pins.map((pin) => (
          <Pin
            {...pin}
            key={pin.id}
            contextMenu={() => props?.contextMenu && props.contextMenu(pin.id)}
            translate={(dx, dy) =>
              props?.translate && props.translate(pin.id, dx, dy)
            }
            pointerdown={() => props?.pointerdown && props.pointerdown(pin.id)}
            pointer={pointer}
          />
        ))}
      </>
    );
  }

  return {
    render(context, plugin) {
      const data = context.data;
      const area =
        plugin.parentScope<BaseAreaPlugin<Schemes, PinsRender>>(BaseAreaPlugin);

      if (data.type === "reroute-pins") {
        return renderPins(data.data, () => area.area.pointer);
      }
    },
  };
}
