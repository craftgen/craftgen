import { DataTable } from "@/components/data-table";
import { ClassicPreset } from "rete";
import useSWR, { mutate } from "swr";
import { deleteDataRow, getDataSet } from "../../../action";

export class DataSourceControl<T> extends ClassicPreset.Control {
  constructor(public datasourceId: string) {
    super();
  }
}

export function DataSourceControlComponent<T>(props: {
  data: DataSourceControl<T>;
}) {
  const { data } = useSWR(`api/datasource/${props.data.datasourceId}`, () =>
    getDataSet(props.data.datasourceId)
  );
  return (
    <DataTable
      data={data?.rows.map((d) => ({ id: d.id, ...(d.data as object) })) || []}
      columns={[
        {
          accessorKey: "name",
          header: "Name",
        },
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

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    await mutate(`api/datasource/${datasourceId}`);
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
        <DropdownMenuItem>Make a copy</DropdownMenuItem>
        <DropdownMenuItem>Favorite</DropdownMenuItem>
        {/* <DropdownMenuSeparator /> */}
        {/* <DropdownMenuSub>
          <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={task.label}>
              {labels.map((label) => (
                <DropdownMenuRadioItem key={label.value} value={label.value}>
                  {label.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleDelete}>
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
