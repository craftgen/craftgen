import { createFileRoute } from "@tanstack/react-router";

import { JSONView } from "@craftgen/ui/components/json-view";
import { ProjectLayout } from "@craftgen/ui/layout/project";

import { api, client } from "../trpc/react";

const ProjectPage = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const { data: project } = api.craft.meta.useQuery(
    {
      projectSlug: params.projectSlug,
      workflowSlug: params.workflowSlug,
    },
    {
      initialData: data,
    },
  );
  return (
    // <ProjectLayout>
    <JSONView src={project} />
    // </ProjectLayout>
  );
};

export const Route = createFileRoute("/$projectSlug/$workflowSlug")({
  loader: async ({ params: { projectSlug, workflowSlug } }) =>
    client.craft.module.meta.query({
      workflowSlug: workflowSlug,
      projectSlug: projectSlug,
    }),
  component: ProjectPage,
});
