"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { RouterOutputs } from "@craftgen/ipc-api";
import { PlaygroundList as PlaygroundListView } from "@craftgen/ui/views/playground-list";

export const PlaygroundList: React.FC<{
  orgSlug: string;
  playgroundList?: RouterOutputs["platform"]["craft"]["module"]["list"];
}> = ({ orgSlug, playgroundList }) => {
  const router = useRouter();
  return (
    <PlaygroundListView
      Link={Link}
      orgSlug={orgSlug}
      playgroundList={playgroundList}
      onWorkflowCreate={(data) =>
        router.push(`/${data.organizationSlug}/${data.slug}/v/0`)
      }
    />
  );
};
