import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { ProjectLayout } from "@craftgen/ui/layout/project";
// import { trpc } from "~/trpc/react";
import { api } from "@craftgen/ui/lib/api";
import { PlaygroundList } from "@craftgen/ui/views/playground-list";
import { ProjectCard } from "@craftgen/ui/views/project-card";

function ProjectPage() {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const { data: project } = api.platform.orgs.bySlug.useQuery(
    {
      orgSlug: params.orgSlug,
    },
    {
      initialData: data,
    },
  );
  const navigate = useNavigate();
  return (
    <ProjectLayout>
      <ProjectLayout.Content>
        <div className="col-span-3 ">
          <ProjectCard project={project} />
        </div>

        <section className="col-span-9">
          <PlaygroundList
            Link={Link}
            orgSlug={project.slug}
            onWorkflowCreate={(data) =>
              navigate({
                to: `/${project.slug}/${data.slug}/v/0`,
                params: {
                  orgSlug: project.slug,
                  workflowSlug: data.slug,
                  version: "0",
                },
              })
            }
          />
        </section>
      </ProjectLayout.Content>
    </ProjectLayout>
  );
}

export const Route = createFileRoute("/_layout/$orgSlug/")({
  loader: async ({ params: { orgSlug }, context: { client } }) =>
    client.platform.orgs.bySlug.ensureData({
      orgSlug: orgSlug,
    }),
  component: ProjectPage,
});
