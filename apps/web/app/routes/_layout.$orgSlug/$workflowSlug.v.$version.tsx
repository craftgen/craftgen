import { createFileRoute, Link } from "@tanstack/react-router";

// import { Playground } from "@craftgen/composer/playground";
// import { api } from "@craftgen/ui/lib/api";
import { trpc } from "~/trpc/react";

export const WorkflowEditor = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const { auth } = Route.useRouteContext();
  const { data: workflow } = trpc.platform.craft.module.meta.useQuery(
    {
      orgSlug: params.orgSlug,
      workflowSlug: params.workflowSlug,
    },
    {
      // initialData: data,
    },
  );

  // return <Playground workflow={workflow} session={auth} Link={Link} />;
  return <div>Hello</div>;
};

export const Route = createFileRoute(
  "/_layout/$orgSlug/$workflowSlug/v/$version",
)({
  // loader: async ({ params, context: { client } }) => {
  //   return client.craft.module.meta.ensureData({
  //     projectSlug: params.projectSlug,
  //     workflowSlug: params.workflowSlug,
  //     version: Number(params.version),
  //   })
  // },
  component: WorkflowEditor,
});
