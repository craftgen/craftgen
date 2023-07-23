"use client";

import useSWR from "swr";
import { createPlayground, getPlaygrounds } from "./actions";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import Link from "next/link";

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
      <div>
        {data?.map((playground) => (
          <Link
            href={`/project/${params.projectSlug}/playground/${playground.id}`}
          >
            <div key={playground.id}>{playground.id}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};
