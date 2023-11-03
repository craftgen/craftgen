"use client";

import { useState } from "react";
import { ResultOfAction } from "@/lib/type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { getWorkflow } from "@/actions/get-workflow";
import { api } from "@/trpc/react";

export const VersionHistory: React.FC<{
  workflow: ResultOfAction<typeof getWorkflow>;
}> = ({ workflow }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {data} = api.craft.version.list.useQuery({
    workflowId: workflow.id,
  })
  const handleChange = (value: string) => {
    router.push(`/${workflow.projectSlug}/${workflow.slug}/v/${value}`);
  };
  return (
    <Select
      defaultValue={String(workflow.currentVersion)}
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
