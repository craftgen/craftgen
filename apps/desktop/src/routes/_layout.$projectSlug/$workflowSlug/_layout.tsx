import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useChildMatches,
} from "@tanstack/react-router";

import { Tabs, TabsList, TabsTrigger } from "@craftgen/ui/components/tabs";
import { WorkflowLayout } from "@craftgen/ui/layout/workflow";
import { api } from "@craftgen/ui/lib/api";
import { ModuleHeader } from "@craftgen/ui/views/module-header";

const WorkflowPageLayout = () => {
  const params = Route.useParams();
  const data = Route.useLoaderData();
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

export const Route = createFileRoute(
  "/_layout/$projectSlug/$workflowSlug/_layout",
)({
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
  loader: async ({
    params: { projectSlug, workflowSlug },
    context: { client },
  }) =>
    client.craft.module.meta.ensureData({
      workflowSlug: workflowSlug,
      projectSlug: projectSlug,
    }),
  component: WorkflowPageLayout,
});
