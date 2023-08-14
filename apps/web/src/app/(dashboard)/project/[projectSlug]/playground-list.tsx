"use client";

import useSWR from "swr";
import { createPlayground, getPlaygrounds } from "./actions";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ResultOf } from "@/lib/type";

const columns: ColumnDef<ResultOf<typeof getPlaygrounds>[number]>[] = [
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <Link
        href={`/project/${row.original.project.slug}/playground/${row.original.id}`}
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    header: "Last Updated",
    accessorKey: "updated_at",
    cell: ({ row }) => row.getValue("updated_at"),
  },
];
export const PlaygroundList: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const { data, isLoading } = useSWR(
    ["playgrounds", projectId],
    ([key, projectId]) => getPlaygrounds(projectId)
  );
  const params = useParams();
  const router = useRouter();
  const handleCreatePlayground = async () => {
    console.log("create playground");
    const newPlayground = await createPlayground({ project_id: projectId });
    router.push(
      `/project/${params.projectSlug}/playground/${newPlayground.id}`
    );
  };
  return (
    <div className="py-4">
      <div className="flex justify-between items-center">
        <h3>Playgrounds</h3>
        <div>
          <Button onClick={handleCreatePlayground}>Create Playground</Button>
        </div>
      </div>
      <div>{data && <DataTable columns={columns} data={data!} />}</div>
    </div>
  );
};
