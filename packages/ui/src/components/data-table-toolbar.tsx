"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import type { Table } from "@tanstack/react-table";

import { Button } from "./button";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  left = null,
  right = null,
  table,
}: // table,
DataTableToolbarProps<TData>) {
  // const table = useTable();
  const isFiltered = table.getState().columnFilters.length > 0;
  // const selection = table.getState().rowSelection;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {left}
        {/* <Input
          placeholder="Filter tasks..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        /> */}
        {/* {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
          />
        )}
        {table.getColumn("priority") && (
          <DataTableFacetedFilter
            column={table.getColumn("priority")}
            title="Priority"
            options={priorities}
          />
        )} */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
      {right}
    </div>
  );
}
