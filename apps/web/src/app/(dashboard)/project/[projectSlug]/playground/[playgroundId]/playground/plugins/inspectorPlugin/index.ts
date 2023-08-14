import { Root } from "rete";
import { Schemes } from "../../types";
import { Scope } from "rete";
import { Area2D } from "rete-area-plugin";

export class InspectorPlugin extends Scope<
  never,
  [Area2D<Schemes>, Root<Schemes>]
> {
  public selectedNodeId: string | null = null;
  constructor() {
    super("inspector");
    this.addPipe((context) => {
      // if (context.type === '')
      if (context.type === "nodepicked") {
        this.selectedNodeId = context.data.id;
        console.log(this);
      }
      if (
        context.type === "pointerdown" &&
        (context.data?.event.target as HTMLElement).classList.contains(
          "background"
        )
      ) {
        this.selectedNodeId = null;
        console.log(this);
      }

      return context;
    });
  }
}
