import { createFileRoute, Link } from "@tanstack/react-router";

import { Playground } from "@craftgen/composer/playground";
import { api } from "@craftgen/ui/lib/api";

export const WorkflowEditor = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const { auth } = Route.useRouteContext();
  const { data: workflow } = api.craft.module.meta.useQuery(
    {
      projectSlug: params.projectSlug,
      workflowSlug: params.workflowSlug,
    },
    {
      initialData: data,
    },
  );

  return <Playground workflow={workflow} session={auth} Link={Link} />;
};

export const Route = createFileRoute(
  "/_layout/$projectSlug/$workflowSlug/v/$version",
)({
  loader: async ({ params, context: { client } }) => {
    return client.craft.module.meta.ensureData({
      projectSlug: params.projectSlug,
      workflowSlug: params.workflowSlug,
      version: Number(params.version),
    });
  },
  component: WorkflowEditor,
});
