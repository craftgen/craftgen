import type { TableControl } from "@craftgen/core/controls/table";
import { DataTable } from "@craftgen/ui/components/data-table";

export function TableControlComponent<T>(props: { data: TableControl<T> }) {
  return <DataTable data={props.data.data} columns={props.data.columns} />;
}
