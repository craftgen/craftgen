import { createFileRoute } from "@tanstack/react-router";

import { JSONView } from "@craftgen/ui/components/json-view";
import { WorkflowLayout } from "@craftgen/ui/layout/workflow";
import { api } from "@craftgen/ui/lib/api";

const ProjectPage = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const { data: workflow } = api.craft.module.meta.useQuery(
    {
      projectSlug: params.projectSlug,
      workflowSlug: params.workflowSlug,
    },
    {
      initialData: data,
    },
  );
  return (
    <WorkflowLayout.Content>
      API
      <JSONView src={workflow} />
    </WorkflowLayout.Content>
  );
};

export const Route = createFileRoute(
  "/_layout/$projectSlug/$workflowSlug/_layout/api",
)({
  loader: async ({
    params: { projectSlug, workflowSlug },
    context: { client },
  }) =>
    client.craft.module.meta.ensureData({
      workflowSlug: workflowSlug,
      projectSlug: projectSlug,
    }),
  component: ProjectPage,
});
