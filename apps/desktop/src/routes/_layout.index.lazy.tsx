import { createLazyFileRoute, Link } from "@tanstack/react-router";

import App from "../App";
import { api } from "../trpc/react";

function Index() {
  const { data: projects } = api.project.all.useQuery();
  return (
    <div className="p-2">
      {projects?.map((project) => (
        <div key={project.id}>
          <Link
            to={`/$projectSlug`}
            params={{
              projectSlug: project.slug,
            }}
          >
            {project.name}
          </Link>
        </div>
      ))}

      <App />
    </div>
  );
}

export const Route = createLazyFileRoute("/_layout/")({
  component: Index,
});
