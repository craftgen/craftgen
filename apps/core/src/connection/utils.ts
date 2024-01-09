import type { NodeView } from "rete-area-plugin";

import type { Node } from "./types";

export function getNodeRect(node: Node, view: NodeView) {
  const {
    position: { x, y },
  } = view;

  return {
    left: x,
    top: y,
    right: x + node.width,
    bottom: y + node.height,
  };
}
