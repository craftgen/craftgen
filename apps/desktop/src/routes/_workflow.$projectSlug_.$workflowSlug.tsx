import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useChildMatches,
} from "@tanstack/react-router";

import { Tabs, TabsList, TabsTrigger } from "@craftgen/ui/components/tabs";
import { WorkflowLayout } from "@craftgen/ui/layout/workflow";
import { ModuleHeader } from "@craftgen/ui/views/module-header";

import { api, client } from "../trpc/react";

const WorkflowPageLayout = () => {
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
  const segment = useChildMatches({
    select: ([m]) => {
      return m?.routeId.split("/").pop();
    },
  });
  return (
    <WorkflowLayout>
      <ModuleHeader
        Link={Link}
        workflow={workflow}
        moduleId={`${workflow.project.slug}/${workflow.slug}`}
      />
      <Tabs className="mt-4" defaultValue={segment}>
        <TabsList>
          <Link to={`/${workflow.project.slug}/${workflow.slug}`}>
            <TabsTrigger value="demo">Demo</TabsTrigger>
          </Link>
          <Link to={`/${workflow.project.slug}/${workflow.slug}/api`}>
            <TabsTrigger value="api">API</TabsTrigger>
          </Link>
          <Link to={`/${workflow.project.slug}/${workflow.slug}/versions`}>
            <TabsTrigger value="versions">Versions</TabsTrigger>
          </Link>
        </TabsList>
      </Tabs>
      <Outlet />
    </WorkflowLayout>
  );
};

export const Route = createFileRoute("/_workflow/$projectSlug/$workflowSlug")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  loader: async ({ params: { projectSlug, workflowSlug } }) =>
    client.craft.module.meta.query({
      workflowSlug: workflowSlug,
      projectSlug: projectSlug,
    }),
  component: WorkflowPageLayout,
});
