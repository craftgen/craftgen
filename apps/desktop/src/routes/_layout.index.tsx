import { createFileRoute, Link } from "@tanstack/react-router";

import { api } from "@craftgen/ui/lib/api";
import { WorkflowList } from "@craftgen/ui/views/workflow-list";

function Index() {
  const data = Route.useLoaderData();
  const { data: featuredWorkflows } = api.craft.module.featured.useQuery(
    {
      category: "all",
    },
    {
      initialData: data.featuredWorkflows,
    },
  );
  return (
    <div className="p-2">
      <div className="py-4">
        <WorkflowList workflows={featuredWorkflows} Link={Link} />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_layout/")({
  component: Index,
  loader: async ({ context: { client } }) => {
    const featuredWorkflows = await client.craft.module.featured.ensureData({
      category: "all",
    });
    return { featuredWorkflows };
  },
});
