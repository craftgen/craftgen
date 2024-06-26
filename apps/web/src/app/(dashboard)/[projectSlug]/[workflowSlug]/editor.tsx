"use client";

import { WorkflowInput } from "@craftgen/composer/input-form-view";
import { LoadingDots } from "@craftgen/ui/components/loading-dots";
import { api } from "@craftgen/ui/lib/api";

export const Editor = ({
  projectSlug,
  workflowSlug,
  version,
  executionId,
}: {
  projectSlug: string;
  workflowSlug: string;
  version: number;
  executionId: string;
}) => {
  const { data: workflow, isLoading } = api.craft.module.get.useQuery(
    {
      projectSlug: projectSlug,
      workflowSlug: workflowSlug,
      version: version!,
      executionId: executionId,
    },
    {
      refetchOnWindowFocus: false,
    },
  );
  return (
    <div>
      <div className="flex min-h-full items-center justify-center">
        {isLoading && <LoadingDots />}
      </div>
      {workflow && <WorkflowInput workflow={workflow} />}
    </div>
  );
};
