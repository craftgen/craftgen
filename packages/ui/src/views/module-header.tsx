import { formatDistanceToNow } from "date-fns";
import { GitFork, Rocket, Slash, Star } from "lucide-react";

import type { RouterOutputs } from "@craftgen/api";

import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Copyable } from "../components/copyable";
import { CLink } from "../components/link";
import { Separator } from "../components/separator";

interface ModuleHeaderProps {
  moduleId: string;
  workflow: RouterOutputs["craft"]["module"]["meta"];
  Link: any;
}

export const ModuleHeader = ({
  workflow: workflow,
  moduleId,
  Link,
}: ModuleHeaderProps) => {
  return (
    <section id="header">
      <div className="flex flex-col items-start justify-between sm:flex-row">
        <div className="flex">
          <h1 className="flex items-center space-x-1 font-mono text-base sm:text-2xl">
            <CLink
              Link={Link}
              to={`/$projectSlug`}
              params={{
                projectSlug: workflow.project.slug,
              }}
              className="text-muted-foreground"
            >
              {workflow.project.slug}
            </CLink>
            <Slash className="-rotate-12 text-muted-foreground" />
            <CLink
              Link={Link}
              to={`/$projectSlug/$workflowSlug`}
              params={{
                projectSlug: workflow.project.slug,
                workflowSlug: workflow.slug,
              }}
            >
              {workflow.name}
            </CLink>
          </h1>
          <Copyable value={moduleId} />
        </div>

        <div className="flex items-center space-x-2">
          <Button variant={"outline"}>
            <GitFork className="mr-2 h-4 w-4" />
            Fork
          </Button>
          <Button variant={"outline"}>
            <Star className="mr-2 h-4 w-4" />
            Star
          </Button>
          <CLink
            Link={Link}
            to={`/$projectSlug/$workflowSlug/v/$version`}
            params={{
              projectSlug: workflow.project.slug,
              workflowSlug: workflow.slug,
              version: workflow.version?.version || 0,
            }}
          >
            <Button variant="outline">
              <Rocket className="mr-2 h-4 w-4" />
              Playground
            </Button>
          </CLink>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex  h-5 w-full flex-row space-x-2 text-sm">
          <span className="mr-2 flex items-center rounded bg-muted p-1 font-mono">
            v{workflow.version?.version || 0}
          </span>
          <Separator orientation="vertical" />
          <Badge variant={"outline"}>
            {workflow.public ? "Public" : "Private"}
          </Badge>
          {workflow.publishedAt && (
            <>
              <Separator orientation="vertical" />
              <span>
                Published{" "}
                {formatDistanceToNow(workflow.publishedAt, {
                  addSuffix: true,
                })}
              </span>
            </>
          )}
        </div>
        <p className="line-clamp-1">{workflow.description}</p>
      </div>
    </section>
  );
};
