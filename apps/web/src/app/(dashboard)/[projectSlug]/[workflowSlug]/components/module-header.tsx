"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Check, Copy, GitFork, Rocket, Slash, Star } from "lucide-react";
import { useCopyToClipboard } from "react-use";

import type { RouterOutputs } from "@seocraft/api";

import { Badge } from "@craftgen/ui/components/badge";
import { Button } from "@craftgen/ui/components/button";
import { Separator } from "@craftgen/ui/components/separator";
import { Tabs, TabsList, TabsTrigger } from "@craftgen/ui/components/tabs";

interface ModuleHeaderProps {
  workflow: RouterOutputs["craft"]["module"]["meta"];
}

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
      <div className="flex flex-col items-start justify-between sm:flex-row">
        <div className="flex">
          <h1 className="flex items-center space-x-1 font-mono text-base sm:text-2xl">
            <Link
              href={`/${workflow.project.slug}`}
              className="text-muted-foreground"
            >
              {workflow.project.slug}
            </Link>
            <Slash className="text-muted-foreground -rotate-12" />
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
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
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
          <Link href={`/${moduleId}/v/${workflow.version?.version || 0}`}>
            <Button variant="outline">
              <Rocket className="mr-2 h-4 w-4" />
              Playground
            </Button>
          </Link>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex  h-5 w-full flex-row space-x-2 text-sm">
          <span className="bg-muted mr-2 flex items-center rounded p-1 font-mono">
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
          <TabsTrigger value="versions">Versions</TabsTrigger>
        </TabsList>
      </Tabs>
    </section>
  );
};
