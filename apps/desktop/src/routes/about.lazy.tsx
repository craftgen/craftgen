import { createLazyFileRoute } from "@tanstack/react-router";

import { api } from "../trpc/react";

export const Route = createLazyFileRoute("/about")({
  component: About,
});

function About() {
  const { data: projects } = api.project.all.useQuery();
  return (
    <div className="p-2 ">
      Hello from About!
      {projects?.map((project) => <div key={project.id}>{project.name}</div>)}
    </div>
  );
}
