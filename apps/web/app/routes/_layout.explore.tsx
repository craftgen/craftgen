import { createFileRoute, Link } from "@tanstack/react-router";

// import { trpc } from "~/trpc/react";
import { api } from "@craftgen/ui/lib/api";
// import { api } from "@craftgen/ui/lib/api";
import { WorkflowList } from "@craftgen/ui/views/workflow-list";

function ExplorePage() {
  const data = Route.useLoaderData();
  // const { data: featuredWorkflows } =
  //   api.platform.craft.module.featured.useQuery(
  //     {
  //       category: "all",
  //     },
  //     {
  //       initialData: data.featuredWorkflows,
  //     },
  //   );

  return (
    <div className="mx-auto flex max-w-6xl flex-col space-y-10 p-4">
      <div className="p-4">
        {/* <WorkflowList workflows={featuredWorkflows} Link={Link} /> */}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_layout/explore")({
  component: ExplorePage,
  loader: async ({ context }) => {
    console.log("context", context);
    const featuredWorkflows =
      await context.client.platform.craft.module.featured.fetch({
        category: "all",
      });
    console.log("FEATURED WORKFLOWS", featuredWorkflows);
    return {
      featuredWorkflows,
    };
  },
});
