"use client";

import useSWR from "swr";
import { getProjects } from "./actions";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const ProjectList = () => {
  const { data, isLoading } = useSWR("projects", getProjects);
  return (
    <div>
      <h1>ProjectList</h1>
      <div className="grid grid-cols-3 gap-4 p-4">
        {data?.map((project) => (
          <ProjectCard key={project.id} projectMembers={project} />
        ))}
      </div>
    </div>
  );
};

const ProjectCard: React.FC<{
  projectMembers: Awaited<ReturnType<typeof getProjects>>[number];
}> = ({ projectMembers }) => {
  return (
    <Link href={`/project/${projectMembers.project.slug}`}>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2>{projectMembers.project.name}</h2>
          <Badge>{projectMembers.role}</Badge>
        </CardHeader>
      </Card>
    </Link>
  );
};
