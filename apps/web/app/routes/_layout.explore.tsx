import { createFileRoute, Link } from "@tanstack/react-router";

import { api } from "@craftgen/ui/lib/api";
import { WorkflowList } from "@craftgen/ui/views/workflow-list";

export const Route = createFileRoute("/_layout/explore")({
  component: ExplorePage,
  loader: async ({ context }) => {
    return {
      featuredWorkflows: [
        {
          id: "1",
          name: "Workflow 1",
          description: "Workflow 1 description",
        },
      ],
    };
  },
  // const featuredWorkflows =
  //      context.client.platform.craft.module.featured.fetch({
  //       category: "all",
  //     });

  //   return {
  //     featuredWorkflows: [
  //       {
  //         id: "1",
  //         name: "Workflow 1",
  //         description: "Workflow 1 description",
  //       },
  //     ],
  //   };
  // },
});

function ExplorePage() {
  const data = Route.useLoaderData();
  console.log("@@@", data);
  // const { data: featuredWorkflows } =
  //   api.platform.craft.module.featured.useQuery(
  //     {
  //       category: "all",
  //     },
  //     {
  //       // initialData: data.featuredWorkflows,
  //     },
  //   );

  return (
    <div className="mx-auto flex max-w-6xl flex-col space-y-10 p-4">
      <div className="p-4">
        {/* <WorkflowList workflows={[]} Link={Link} /> */}
      </div>
    </div>
  );
}
