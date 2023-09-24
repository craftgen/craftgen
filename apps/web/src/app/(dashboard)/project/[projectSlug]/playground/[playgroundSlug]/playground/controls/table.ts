import { ClassicPreset } from "rete";
import type { ColumnDef } from "@tanstack/react-table";

export class TableControl<T> extends ClassicPreset.Control {
  __type = "table";

  constructor(public columns: ColumnDef<T>[], public data: T[]) {
    super();
  }
}
