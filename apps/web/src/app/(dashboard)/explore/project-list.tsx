"use client";

import useSWR from "swr";
import { getUserProjects } from "./actions";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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
      <Card className="group-hover:shadow-sm group-hover:shadow-primary/40 transition duration-300">
        <CardHeader className="flex justify-between items-center">
          <h2>
            {projectMembers.project.name}
            {projectMembers.project.personal && (
              <span className="text-xs text-muted-foreground"> (Personal)</span>
            )}
          </h2>
          <Badge>{projectMembers.role}</Badge>
        </CardHeader>
      </Card>
    </Link>
  );
};
