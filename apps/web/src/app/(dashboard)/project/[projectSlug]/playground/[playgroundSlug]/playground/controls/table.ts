import { ClassicPreset } from "rete";
import type { ColumnDef } from "@tanstack/react-table";
import { BaseControl } from "./base";

export class TableControl<T> extends BaseControl {
  __type = "table";

  constructor(public columns: ColumnDef<T>[], public data: T[]) {
    super(200);
  }
}
