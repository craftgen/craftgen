import { debounce } from "lodash-es";
import { Scope, type Root } from "rete";
import type { Area2D } from "rete-area-plugin";

import type { ReteStoreInstance } from "../../store";
import type { Schemes } from "../../types";

export class InspectorPlugin extends Scope<
  never,
  [Area2D<Schemes>, Root<Schemes>]
> {
  public selectedNodeId: string | null = null;
  constructor(store: ReteStoreInstance) {
    super("inspector");
    const debounced = debounce((position) => {
      store.getState().setPosition(position);
    }, 100);

    this.addPipe((context) => {
      if (context.type === "pointermove") {
        debounced(context.data.position);
        return context;
      }
      if (context.type === "nodepicked") {
        requestAnimationFrame(() => {
          store.getState().setSelectedNodeId(context.data.id);
          this.selectedNodeId = context.data.id;
        });
        return context;
      }
      if (context.type === "pointerdown") {
        if (
          (context.data?.event.target as HTMLElement).classList.contains(
            "background",
          ) &&
          this.selectedNodeId
        ) {
          requestAnimationFrame(() => {
            store.getState().setSelectedNodeId(null);
            this.selectedNodeId = null;
          });
          return context;
        }
      }

      return context;
    });
  }
}
