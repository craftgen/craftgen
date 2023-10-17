import { Root } from "rete";
import { Schemes } from "../../types";
import { Scope } from "rete";
import { Area2D } from "rete-area-plugin";
import { ReteStoreInstance } from "../../store";
import { debounce } from "lodash-es";

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
            "background"
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
