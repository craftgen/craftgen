import { ClassicPreset } from "rete";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";

export class TableControl<T> extends ClassicPreset.Control {
  __type = "table";

  constructor(public columns: ColumnDef<T>[], public data: T[]) {
    super();
  }
}

export function TableControlComponent<T>(props: { data: TableControl<T> }) {
  return <DataTable data={props.data.data} columns={props.data.columns} />;
}
