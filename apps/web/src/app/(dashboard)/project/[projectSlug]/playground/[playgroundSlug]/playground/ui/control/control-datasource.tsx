import { ClassicPreset } from "rete";
import useSWR, { mutate } from "swr";
import { deleteDataRow, getDataSet } from "../../../action";

export class DataSourceControl<T> extends ClassicPreset.Control {
  constructor(public datasourceId: string) {
    super();
  }
}

const generateColumnDefs = (data: Record<string, any>[]): ColumnDef<any>[] => {
  const uniqueKeys = new Set<string>();
  data.forEach((obj) => {
    Object.keys(obj).forEach((key) => uniqueKeys.add(key));
  });

  const columnDefs: ColumnDef<any>[] = [];
  uniqueKeys.forEach((key) => {
    const header = key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    columnDefs.push({ accessorKey: key, header });
  });
  return columnDefs;
};

export function DataSourceControlComponent<T>(props: {
  data: DataSourceControl<T>;
}) {
  const { data } = useSWR(`/api/datasource/${props.data.datasourceId}`, () =>
    getDataSet(props.data.datasourceId)
  );
  const columns = useMemo(() => {
    const sss = sampleSize(data?.rows, 5).map((row) => row.data) as object[];
    return generateColumnDefs(sss);
  }, [data, data?.rows]);

  return (
    <DataTable
      data={data?.rows.map((d) => ({ id: d.id, ...(d.data as object) })) || []}
      columns={[
        {
          id: "select",
          header: ({ table }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
              className="translate-y-[2px]"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              className="translate-y-[2px]"
            />
          ),
          enableSorting: false,
          enableHiding: false,
        },
        ...columns,
        {
          id: "actions",
          cell: ({ row }) => (
            <DataSourceTableRowActions
              row={row}
              datasourceId={props.data.datasourceId}
            />
          ),
        },
      ]}
    />
  );
}
export const Headerleft = () => {
  const table = useTable();
  const selectedRows = table.getState().rowSelection;
  useEffect(() => {
    console.log("table");
  }, [table]);
  return (
    <div>
      {JSON.stringify(selectedRows)}
      <Button
        variant={Object.keys(selectedRows).length > 0 ? "destructive" : "ghost"}
      >
        Delete
      </Button>
    </div>
  );
};

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { ColumnDef, Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useMemo } from "react";
import { sampleSize } from "lodash-es";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/data-table";
import { useTable } from "@/components/use-table";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  datasourceId: string;
}

export function DataSourceTableRowActions<TData>({
  row,
  datasourceId,
}: DataTableRowActionsProps<TData>) {
  const handleDelete = async () => {
    await deleteDataRow({ id: row.id });
    await mutate(`/api/datasource/${datasourceId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        {/* <DropdownMenuItem>Make a copy</DropdownMenuItem> */}
        {/* <DropdownMenuItem>Favorite</DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleDelete}>
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
