"use client";

import React, { useState } from "react";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { PlusIcon, Rocket } from "lucide-react";

import { RouterOutputs } from "@craftgen/api";

import { Button } from "../components/button";
import { DataTable } from "../components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { CLink } from "../components/link";
import { api } from "../lib/api";
import { WorkflowCreateDialog } from "./playground-create-dialog";
import { WorkflowEditDialog } from "./playground-edit-dialog";

type Playground = RouterOutputs["craft"]["module"]["list"][number];

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  projectSlug: string;
}

export function PlaygroundListTableRowActions<TData extends { id: string }>({
  row,
}: DataTableRowActionsProps<TData>) {
  // const { data: project } = api.project.bySlug.useQuery({
  //   projectSlug: projectSlug,
  // });
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
    // const res = await clonePlayground({
    //   playgroundId: row.original.id,
    //   targetProjectId: project?.id!,
    // });
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

export const PlaygroundList = <T extends React.ComponentType<any>>({
  projectSlug,
  onWorkflowCreate,
  Link,
}: {
  projectSlug: string;
  Link: T;
  onWorkflowCreate: (data: RouterOutputs["craft"]["module"]["create"]) => void;
}) => {
  const { data } = api.craft.module.list.useQuery({
    projectSlug,
  });
  const [isOpen, setOpen] = useState(false);
  const columns: ColumnDef<Playground>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <CLink
          Link={Link}
          to={`/$projectSlug/$workflowSlug`}
          params={{
            projectSlug: row.original.project.slug,
            workflowSlug: row.original.slug,
          }}
          className="font-bold"
        >
          {row.getValue("name")}
        </CLink>
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
          <CLink
            Link={Link}
            to={`/$projectSlug/$workflowSlug/v/$version`}
            params={{
              projectSlug: row.original.project.slug,
              workflowSlug: row.original.slug,
              version: row.original.version.version,
            }}
          >
            <Button variant="outline">
              <Rocket className="mr-2 h-4 w-4" />
              Playground
            </Button>
          </CLink>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <PlaygroundListTableRowActions<Playground>
          row={row}
          projectSlug={row.original.project.slug}
        />
      ),
    },
  ];

  return (
    <div className="rounded-lg border  bg-background p-4 shadow">
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
        <WorkflowCreateDialog
          isOpen={isOpen}
          onOpenChange={setOpen}
          projectSlug={projectSlug}
          onCreate={onWorkflowCreate}
        />
      )}
    </div>
  );
};
