import type { ReactElement } from "react";
import type { BaseSchemes } from "rete";

import type { ReactPlugin } from "..";

export interface RenderPreset<Schemes extends BaseSchemes, T> {
  attach?: (plugin: ReactPlugin<Schemes, T>) => void;
  render: (
    context: Extract<T, { type: "render" }>,
    plugin: ReactPlugin<Schemes, T>,
  ) => ReactElement | null | undefined;
}
