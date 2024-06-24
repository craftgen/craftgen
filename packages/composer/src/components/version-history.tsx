"use client";

import { useState } from "react";

// import { useRouter } from "next/navigation";

import { RouterOutputs } from "@craftgen/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@craftgen/ui/components/select";
import { api } from "@craftgen/ui/lib/api";

export const VersionHistory: React.FC<{
  workflow: RouterOutputs["craft"]["module"]["meta"];
}> = ({ workflow }) => {
  const [open, setOpen] = useState(false);
  // const router = useRouter();
  const { data } = api.craft.version.list.useQuery({
    workflowId: workflow.id,
  });
  const handleChange = (value: string) => {
    throw new Error("Not implemented");
    // router.push(`/${workflow.projectSlug}/${workflow.slug}/v/${value}`);
  };
  return (
    <Select
      defaultValue={String(workflow.version?.version)}
      onValueChange={handleChange}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className="h-8 font-mono">
        <SelectValue placeholder="Select a version" />
      </SelectTrigger>
      <SelectContent>
        {data?.map((version) => (
          <SelectItem key={version.id} value={String(version.version)}>
            v{version.version} {!version.publishedAt && "(Draft)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
