import { createFileRoute, Outlet } from "@tanstack/react-router";

import { JSONView } from "@craftgen/ui/components/json-view";

import { api, client } from "../trpc/react";

const WorkflowLayout = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const { data: project } = api.craft.module.meta.useQuery(
    {
      projectSlug: params.projectSlug,
      workflowSlug: params.workflowSlug,
    },
    {
      initialData: data,
    },
  );
  return (
    <div className="border-4 border-red-500 bg-red-500/40 p-4">
      <JSONView src={project} />
      <div className="border p-4">
        <Outlet />
      </div>
    </div>
  );
};

export const Route = createFileRoute("/_workflow")({
  component: WorkflowLayout,
  loader: async ({ params: { projectSlug, workflowSlug } }) =>
    client.craft.module.meta.query({
      workflowSlug: workflowSlug,
      projectSlug: projectSlug,
    }),
});
