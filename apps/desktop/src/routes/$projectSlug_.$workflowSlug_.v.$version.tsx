import { createFileRoute, Link } from "@tanstack/react-router";

import { Playground } from "@craftgen/composer/playground";

import { api, client } from "../trpc/react";

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

export const Route = createFileRoute("/$projectSlug/$workflowSlug/v/$version")({
  loader: async (context) => {
    const workflow = await client.craft.module.meta.query({
      projectSlug: context.params.projectSlug,
      workflowSlug: context.params.workflowSlug,
      version: Number(context.params.version),
    });
    return workflow;
  },
  component: WorkflowEditor,
});
