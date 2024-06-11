import { createFileRoute } from "@tanstack/react-router";

import { JSONView } from "@craftgen/ui/components/json-view";

import { api, client } from "../trpc/react";

const ProjectPage = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const project = api.project.bySlug.useQuery(
    {
      projectSlug: params.projectSlug,
    },
    {
      initialData: data,
    },
  );
  return (
    <div>
      <div className="bg-muted p-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex flex-row items-center space-x-2">
            <h2 className="text-2xl font-bold">{project.data?.name}</h2>
          </div>
          <JSONView src={data} />
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/project/$projectSlug")({
  loader: async ({ params: { projectSlug } }) =>
    client.project.bySlug.query({
      projectSlug: projectSlug,
    }),
  component: ProjectPage,
});
