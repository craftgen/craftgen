"use client";

import { RouterOutputs } from "@craftgen/api";

import { Badge } from "../components/badge";
import { Card, CardHeader } from "../components/card";
import { CLink } from "../components/link";
import { api } from "../lib/api";

export const ProjectList = ({ Link }: { Link: any }) => {
  const { data } = api.project.userProjects.useQuery();
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 ">
        {data?.map((project) => (
          <ProjectCard key={project.id} projectMembers={project} Link={Link} />
        ))}
      </div>
    </div>
  );
};

const ProjectCard: React.FC<{
  projectMembers: RouterOutputs["project"]["userProjects"][number];
  Link: any;
}> = ({ projectMembers, Link }) => {
  return (
    <CLink
      to={`/$projectSlug`}
      params={{
        projectSlug: projectMembers.project.slug,
      }}
      className="group"
      Link={Link}
    >
      <Card className="transition duration-300 group-hover:shadow-sm group-hover:shadow-primary/40">
        <CardHeader className="flex items-center justify-between">
          <h2>
            {projectMembers.project.name}
            {projectMembers.project.personal && (
              <span className="text-xs text-muted-foreground"> (Personal)</span>
            )}
          </h2>
          <Badge>{projectMembers.role}</Badge>
        </CardHeader>
      </Card>
    </CLink>
  );
};
