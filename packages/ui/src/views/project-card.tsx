"use client";

import { RouterOutputs } from "@craftgen/api";

import { Avatar, AvatarFallback, AvatarImage } from "../components/avatar";
import { Card } from "../components/card";

export const ProjectCard = ({
  project,
}: {
  project: RouterOutputs["project"]["bySlug"];
}) => {
  return (
    <Card className="space-y-2 rounded-lg p-4 shadow">
      <div className="flex w-full items-center justify-center">
        <Avatar className="h-40 w-40">
          {project?.avatar_url && <AvatarImage src={project.avatar_url} />}
          <AvatarFallback>{project.slug[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
      <h1 className="font-mono text-xl font-bold leading-tight">
        {project?.name}
      </h1>
      <h2 className="text-lg leading-tight text-muted-foreground">
        {project?.slug}
      </h2>
    </Card>
  );
};
