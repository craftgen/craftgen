"use client";

import useSWR, { mutate } from "swr";
import {
  clonePlayground,
  createPlayground,
  deletePlayground,
  getPlaygrounds,
} from "./actions";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ResultOf } from "@/lib/type";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { PlaygroundEditDialog } from "./playground-edit-dialog";
import { useProject } from "./hooks/use-project";
import { PlaygroundCreateDialog } from "./playground-create-dialog";
import { PlusIcon, Rocket } from "lucide-react";

type Playground = ResultOf<typeof getPlaygrounds>[number];

const columns: ColumnDef<Playground>[] = [
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <Link href={`/${row.original.project.slug}/${row.original.slug}`}>
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    header: "Last Updated",
    accessorKey: "updatedAt",
    cell: ({ row }) => formatDistanceToNow(row.getValue("updatedAt")),
  },
  {
    header: "Public",
    accessorKey: "public",
    cell: ({ row }) => (row.getValue("public") ? "Yes" : "No"),
  },
  {
    id: "playground",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Link
          href={`/${row.original?.project.slug}/${row.original.slug}/playground`}
        >
          <Button variant="outline">
            <Rocket className="w-4 h-4 mr-2" />
            Playground
          </Button>
        </Link>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <PlaygroundListTableRowActions<Playground> row={row} />,
  },
];
interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function PlaygroundListTableRowActions<TData extends { id: string }>({
  row,
}: DataTableRowActionsProps<TData>) {
  const { data: project } = useProject();
  const [editDialog, setEditDialog] = React.useState(false);
  const handleDelete = async () => {
    await deletePlayground({ id: row.original.id });
    mutate(`/api/project/${project?.id}/playgrounds`);
  };
  const handleClone = async () => {
    const res = await clonePlayground({
      playgroundId: row.original.id,
      targetProjectId: project?.id!,
    });
    mutate(`/api/project/${project?.id}/playgrounds`);
    console.log(res);
  };

  return (
    <>
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
          <DropdownMenuItem onSelect={() => setEditDialog(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleClone()}>
            Make a copy
          </DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleDelete}>
            Delete
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {editDialog && (
        <PlaygroundEditDialog
          isOpen={editDialog}
          onOpenChange={setEditDialog}
          playground={row.original}
        />
      )}
    </>
  );
}

export const PlaygroundList: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const { data, isLoading } = useSWR(
    `/api/project/${projectId}/playgrounds`,
    () => getPlaygrounds(projectId)
  );
  const [isOpen, setOpen] = useState(false);
  return (
    <div className="py-4">
      <div>
        {data && (
          <DataTable
            columns={columns}
            data={data!}
            headerRight={
              <Button
                onClick={() => setOpen(true)}
                size={"sm"}
                className="ml-2"
                variant={"outline"}
              >
                <PlusIcon className="text-muted-foreground" />
                Create Playground
              </Button>
            }
          />
        )}
      </div>
      {isOpen && (
        <PlaygroundCreateDialog isOpen={isOpen} onOpenChange={setOpen} />
      )}
    </div>
  );
};
