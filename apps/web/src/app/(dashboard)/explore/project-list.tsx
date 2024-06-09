"use client";

import Link from "next/link";
import useSWR from "swr";

import { Badge } from "@craftgen/ui/badge";
import { Card, CardHeader } from "@craftgen/ui/card";

import { getUserProjects } from "./actions";

export const ProjectList = () => {
  const { data, isLoading } = useSWR("projects", getUserProjects);
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 ">
        {data?.map((project) => (
          <ProjectCard key={project.id} projectMembers={project} />
        ))}
      </div>
    </div>
  );
};

const ProjectCard: React.FC<{
  projectMembers: Awaited<ReturnType<typeof getUserProjects>>[number];
}> = ({ projectMembers }) => {
  return (
    <Link href={`/${projectMembers.project.slug}`} className="group">
      <Card className="group-hover:shadow-primary/40 transition duration-300 group-hover:shadow-sm">
        <CardHeader className="flex items-center justify-between">
          <h2>
            {projectMembers.project.name}
            {projectMembers.project.personal && (
              <span className="text-muted-foreground text-xs"> (Personal)</span>
            )}
          </h2>
          <Badge>{projectMembers.role}</Badge>
        </CardHeader>
      </Card>
    </Link>
  );
};
