"use client";

import useSWR from "swr";
// import { getWorkflow, getWorkflowVersions } from "../../../action";
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
import { getWorkflowVersions } from "@/actions/get-workflow-versions";
import { getWorkflow } from "@/actions/get-workflow";

export const VersionHistory: React.FC<{
  workflow: ResultOfAction<typeof getWorkflow>;
}> = ({ workflow }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data, error } = useSWR("/api/workflow/versions", () =>
    getWorkflowVersions({
      projectSlug: workflow.projectSlug,
      workflowSlug: workflow.slug,
    })
  );
  const handleChange = (value: string) => {
    router.push(`/${workflow.projectSlug}/${workflow.slug}/${value}`);
  };
  return (
    <Select
      defaultValue={String(workflow.currentVersion)}
      onValueChange={handleChange}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a version" />
      </SelectTrigger>
      <SelectContent>
        {data?.data?.versions.map((version) => (
          <SelectItem key={version.id} value={String(version.version)}>
            v{version.version} {!version.publishedAt && "(Draft)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
