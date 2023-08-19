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
      }
      // if (context.type === '')
      if (context.type === "nodepicked") {
        store.getState().setSelectedNodeId(context.data.id);
        this.selectedNodeId = context.data.id;
      }
      if (
        context.type === "pointerdown" &&
        (context.data?.event.target as HTMLElement).classList.contains(
          "background"
        )
      ) {
        store.getState().setSelectedNodeId(null);
        this.selectedNodeId = null;
      }

      return context;
    });
  }
}
