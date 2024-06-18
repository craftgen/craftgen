import type { BaseSchemes } from "rete";
import type { AreaPlugin } from "rete-area-plugin";

export function addCustomBackground<S extends BaseSchemes, K>(
  area: AreaPlugin<S, K>,
) {
  const background = document.createElement("div");

  background.classList.add("background");
  background.classList.add("fill-area");
  area.area.content.add(background);
}
