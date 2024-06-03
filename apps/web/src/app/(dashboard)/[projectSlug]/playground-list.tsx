"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { PlusIcon, Rocket } from "lucide-react";
import { mutate } from "swr";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { clonePlayground } from "./actions";
import { useProject } from "./hooks/use-project";
import { WorkflowCreateDialog } from "./playground-create-dialog";
import { WorkflowEditDialog } from "./playground-edit-dialog";
import { api } from "@/trpc/react";
import { RouterOutputs } from "@/trpc/shared";

type Playground = RouterOutputs["craft"]["module"]["list"][number];

const columns: ColumnDef<Playground>[] = [
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <Link
        href={`/${row.original.project.slug}/${row.original.slug}`}
        className="font-bold"
      >
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
          href={`/${row.original?.project.slug}/${row.original.slug}/v/${row.original.version.version}`}
        >
          <Button variant="outline">
            <Rocket className="mr-2 h-4 w-4" />
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
  const utils = api.useUtils();
  const { mutateAsync: deleteWorkflow } = api.craft.module.delete.useMutation({
    onSuccess: async () => {
      await utils.craft.module.list.invalidate();
    },
  });
  const handleDelete = async () => {
    await deleteWorkflow({ workflowId: row.original.id });
  };
  const handleClone = async () => {
    const res = await clonePlayground({
      playgroundId: row.original.id,
      targetProjectId: project?.id!,
    });
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
        <WorkflowEditDialog
          isOpen={editDialog}
          onOpenChange={setEditDialog}
          workflow={row.original}
        />
      )}
    </>
  );
}

export const PlaygroundList: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const { data } = api.craft.module.list.useQuery({
    projectId: projectId,
  });
  const [isOpen, setOpen] = useState(false);

  return (
    <div className="py-4">
      <div>
        {data && (
          <DataTable
            columns={columns}
            data={data}
            headerLeft={<h1 className="text-xl font-semibold">Playgrounds</h1>}
            headerRight={
              <Button
                onClick={() => setOpen(true)}
                size={"sm"}
                className="ml-2"
                id="create-playground-button"
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
        <WorkflowCreateDialog isOpen={isOpen} onOpenChange={setOpen} />
      )}
    </div>
  );
};
