import { Root } from "rete";
import { Schemes } from "../../types";
import { Scope } from "rete";
import { Area2D } from "rete-area-plugin";
import { ReteStoreInstance } from "../../store";

export class InspectorPlugin extends Scope<
  never,
  [Area2D<Schemes>, Root<Schemes>]
> {
  public selectedNodeId: string | null = null;
  constructor(store: ReteStoreInstance) {
    super("inspector");
    this.addPipe((context) => {
      if (context.type === "pointermove") {
        store.getState().setPosition(context.data.position);
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
