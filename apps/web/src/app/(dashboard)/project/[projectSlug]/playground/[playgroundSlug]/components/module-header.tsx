"use client";

import Link from "next/link";
import type { getPlayground } from "../action";
import { ResultOf } from "@/lib/type";
import {
  Check,
  Copy,
  GitFork,
  Rocket,
  RocketIcon,
  Slash,
  Star,
} from "lucide-react";
import { useCopyToClipboard } from "react-use";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

type ModuleHeaderProps = {
  playground: ResultOf<typeof getPlayground>;
};

export const ModuleHeader = ({ playground, ...props }: ModuleHeaderProps) => {
  const [state, copyToClipboard] = useCopyToClipboard();
  const moduleId = useMemo(() => {
    return `${playground.project.slug}/${playground.slug}`;
  }, [playground.project.slug, playground.slug]);
  return (
    <section id="header">
      <div className="flex flex-col sm:flex-row justify-between items-start">
        <div className="flex">
          <h1 className="text-base sm:text-2xl flex space-x-1 items-center font-mono">
            <Link
              href={`/${playground.project.slug}`}
              className="text-muted-foreground"
            >
              {playground.project.slug}
            </Link>
            <Slash className="-rotate-12 text-muted-foreground" />
            <Link href={`/${playground.project.slug}/${playground.slug}`}>
              {playground.name}
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
          <Link href={`/${moduleId}/playground`}>
            <Button variant="outline">
              <Rocket className="w-4 h-4 mr-2" />
              Playground
            </Button>
          </Link>
        </div>
      </div>
      <p>{playground.description}</p>
      <Badge variant={"outline"}>
        {playground.public ? "Public" : "Private"}
      </Badge>
    </section>
  );
};
