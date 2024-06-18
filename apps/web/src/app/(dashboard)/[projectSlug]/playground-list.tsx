"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PlaygroundList as PlaygroundListView } from "@craftgen/ui/views/playground-list";

export const PlaygroundList: React.FC<{
  projectSlug: string;
}> = ({ projectSlug }) => {
  const router = useRouter();
  return (
    <PlaygroundListView
      Link={Link}
      projectSlug={projectSlug}
      onWorkflowCreate={(data) =>
        router.push(`/${data.projectSlug}/${data.slug}/v/0`)
      }
    />
  );
};
