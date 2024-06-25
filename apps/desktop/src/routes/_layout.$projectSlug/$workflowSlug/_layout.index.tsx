import { createFileRoute } from "@tanstack/react-router";

import { WorkflowInput } from "@craftgen/composer/input-form-view";
import { LoadingDots } from "@craftgen/ui/components/loading-dots";
import { WorkflowLayout } from "@craftgen/ui/layout/workflow";
import { api } from "@craftgen/ui/lib/api";

const ProjectPage = () => {
  const initial = Route.useLoaderData();
  const params = Route.useParams();
  const { data: module } = api.craft.module.meta.useQuery(
    {
      projectSlug: params.projectSlug,
      workflowSlug: params.workflowSlug,
    },
    {
      initialData: initial.module,
    },
  );

  const { data: workflow, isLoading } = api.craft.module.get.useQuery(
    {
      projectSlug: params.projectSlug,
      workflowSlug: params.workflowSlug,
      version: Number(module?.version?.version),
      executionId: module?.execution?.id,
    },
    {
      initialData: initial.workflow,
    },
  );

  return (
    <WorkflowLayout.Content>
      {isLoading && <LoadingDots />}
      {workflow && <WorkflowInput workflow={workflow} />}
    </WorkflowLayout.Content>
  );
};

export const Route = createFileRoute(
  "/_layout/$projectSlug/$workflowSlug/_layout/",
)({
  loader: async ({
    params: { projectSlug, workflowSlug },
    context: { client },
  }) => {
    const module = await client.craft.module.meta.ensureData({
      workflowSlug: workflowSlug,
      projectSlug: projectSlug,
    });
    const workflow = await client.craft.module.get.ensureData({
      workflowSlug: workflowSlug,
      projectSlug: projectSlug,
      version: Number(module?.version?.version),
      executionId: module?.execution?.id,
    });
    return { module, workflow };
  },
  component: ProjectPage,
});
