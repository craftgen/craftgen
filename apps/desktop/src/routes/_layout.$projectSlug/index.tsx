import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { ProjectLayout } from "@craftgen/ui/layout/project";
import { api } from "@craftgen/ui/lib/api";
import { PlaygroundList } from "@craftgen/ui/views/playground-list";
import { ProjectCard } from "@craftgen/ui/views/project-card";

const ProjectPage = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const { data: project } = api.project.bySlug.useQuery(
    {
      projectSlug: params.projectSlug,
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
            projectSlug={params.projectSlug}
            onWorkflowCreate={(data) =>
              navigate({
                to: `/$projectSlug/$workflowSlug/v/$version`,
                params: {
                  projectSlug: data.projectSlug,
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
};

export const Route = createFileRoute("/_layout/$projectSlug/")({
  loader: async ({ params: { projectSlug }, context: { client } }) =>
    client.project.bySlug.ensureData({
      projectSlug: projectSlug,
    }),
  component: ProjectPage,
});
