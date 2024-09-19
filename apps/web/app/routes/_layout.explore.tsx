import { createFileRoute, Link } from '@tanstack/react-router'

import { api } from '@craftgen/ui/lib/api'
import { WorkflowList } from '@craftgen/ui/views/workflow-list'

function ExplorePage() {
  const data = Route.useLoaderData()
  // const { data: featuredWorkflows } = api.platform.craft.module.featured.useQuery(
  //   {
  //     category: "all",
  //   },
  //   {
  //     initialData: data.featuredWorkflows,
  //   },
  // );
  return (
    <div className="mx-auto flex max-w-6xl flex-col space-y-10 p-4">
      <div className="p-4">
        {JSON.stringify(data)}
        {/* <WorkflowList workflows={featuredWorkflows} Link={Link} /> */}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_layout/explore')({
  component: ExplorePage,
  loader: async ({ context: { client } }) => {
    const featuredWorkflows = await client.platform.craft.module.featured.query({
      category: "all",
    });
    return { featuredWorkflows };
  },
})
