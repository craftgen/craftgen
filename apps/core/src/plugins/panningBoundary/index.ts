import { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";
import type { Selector } from "rete-area-plugin/_types/extensions";

import type { AreaExtra } from "../../editor";
import type { Schemes } from "../../types";
import { getFrameWeight } from "./frame";
import { animate, watchPointerMove } from "./utils";

interface Props {
  area: AreaPlugin<Schemes, AreaExtra<Schemes>>;
  selector: Selector<any>;
  intensity?: number;
  padding?: number;
}

export function setupPanningBoundary(props: Props) {
  const selector = props.selector;
  const padding = props.padding ?? 30;
  const intensity = props.intensity ?? 2;
  const area = props.area;
  const editor = area.parentScope(NodeEditor);
  const pointermove = watchPointerMove();
  const ticker = animate(async () => {
    const { clientX, clientY, pageX, pageY } = pointermove.getEvent();
    const weights = getFrameWeight(
      clientX,
      clientY,
      area.container.getBoundingClientRect(),
      padding,
    );
    const velocity = {
      x: (weights.left - weights.right) * intensity,
      y: (weights.top - weights.bottom) * intensity,
    };

    const pickedNode = editor
      .getNodes()
      .find((n) => selector.isPicked({ label: "node", id: n.id }));
    const view = pickedNode && area.nodeViews.get(pickedNode.id);
    if (!view) return;

    const { position } = view;
    const dragHandler = view.dragHandler as any;

    dragHandler.pointerStart = {
      x: pageX + velocity.x,
      y: pageY + velocity.y,
    };
    dragHandler.startPosition = {
      ...dragHandler.config.getCurrentPosition(),
    };

    const { transform } = area.area;
    const x = position.x - velocity.x / transform.k;
    const y = position.y - velocity.y / transform.k;

    await Promise.all([
      area.area.translate(transform.x + velocity.x, transform.y + velocity.y),
      area.translate(pickedNode.id, { x, y }),
    ]);
  });

  area.addPipe((context) => {
    if (context.type === "nodepicked") ticker.start();
    if (context.type === "nodedragged") ticker.stop();
    return context;
  });

  return {
    destroy() {
      pointermove.destroy();
    },
  };
}
