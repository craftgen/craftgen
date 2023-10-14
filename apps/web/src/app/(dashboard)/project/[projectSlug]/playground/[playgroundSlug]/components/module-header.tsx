"use client";

import Link from "next/link";
import type { getWorkflowMeta } from "@/actions/get-workflow-meta";
import { ResultOfAction } from "@/lib/type";
import { Check, Copy, GitFork, Rocket, Slash, Star } from "lucide-react";
import { useCopyToClipboard } from "react-use";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";

type ModuleHeaderProps = {
  workflow: ResultOfAction<typeof getWorkflowMeta>;
};

export const ModuleHeader = ({
  workflow: workflow,
  ...props
}: ModuleHeaderProps) => {
  const segment = useSelectedLayoutSegment();
  const [state, copyToClipboard] = useCopyToClipboard();
  const moduleId = useMemo(() => {
    return `${workflow.project.slug}/${workflow.slug}`;
  }, [workflow.project.slug, workflow.slug]);
  const router = useRouter();
  return (
    <section id="header">
      <div className="flex flex-col sm:flex-row justify-between items-start">
        <div className="flex">
          <h1 className="text-base sm:text-2xl flex space-x-1 items-center font-mono">
            <Link
              href={`/${workflow.project.slug}`}
              className="text-muted-foreground"
            >
              {workflow.project.slug}
            </Link>
            <Slash className="-rotate-12 text-muted-foreground" />
            <Link href={`/${workflow.project.slug}/${workflow.slug}`}>
              {workflow.name}
            </Link>
          </h1>
          <Button
            onClick={() => copyToClipboard(moduleId)}
            variant={"ghost"}
            size="icon"
          >
            {state.value ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="space-x-2 flex items-center">
          <Button variant={"outline"}>
            <GitFork className="w-4 h-4 mr-2" />
            Fork
          </Button>
          <Button variant={"outline"}>
            <Star className="w-4 h-4 mr-2" />
            Star
          </Button>
          <Link href={`/${moduleId}/v/${workflow.version?.version || 0}`}>
            <Button variant="outline">
              <Rocket className="w-4 h-4 mr-2" />
              Playground
            </Button>
          </Link>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex  flex-row w-full text-sm h-5 space-x-2">
          <span className="mr-2 bg-muted rounded p-1 flex items-center font-mono">
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

      <Tabs
        className="mt-4"
        defaultValue={segment ?? "demo"}
        onValueChange={(v) => {
          const path = v === "demo" ? "" : `/${v}`;
          router.push(`/${moduleId}${path}`);
        }}
      >
        <TabsList>
          <TabsTrigger value="demo">Demo</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
        </TabsList>
      </Tabs>
    </section>
  );
};
