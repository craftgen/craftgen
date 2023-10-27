"use client";

import { getWorkflow } from "@/actions/get-workflow";

import { ResultOfAction } from "@/lib/type";
import { Shrink, Lock } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useRete } from "rete-react-plugin";
import { ContextMenuProvider } from "./context-menu";
import { createEditorFunc } from "./editor";
import { useCraftStore } from "./use-store";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export const Composer: React.FC<{
  workflow: ResultOfAction<typeof getWorkflow>;
  store: any;
}> = ({ workflow, store }) => {
  const di = useCraftStore((state) => state.di);
  const createEditor = useMemo(() => {
    return createEditorFunc({
      workflow,
      store: store.current,
    });
  }, [workflow, store.current]);
  const [ref, rete] = useRete(createEditor);
  useEffect(() => {
    console.log("444", rete?.cursorPosition);
  }, [rete?.cursorPosition]);
  return (
    <div className="w-full h-full">
      {JSON.stringify(rete?.cursorPosition)}
      <div className="absolute top-1 right-1 z-50 flex ">
        {workflow.readonly && workflow.version.publishedAt && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={"outline"}
                className="cursor-pointer group"
                size="sm"
              >
                <Lock className="w-4 h-4 group-hover:mr-2" />
                <span className="hidden group-hover:block">Read Only</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              This workflow is read-only because it is published.
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={"ghost"} size="icon" onClick={() => di?.setUI()}>
              <Shrink />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Center the content</TooltipContent>
        </Tooltip>
      </div>
      <ContextMenuProvider>
        <div ref={ref} className="w-full h-full " />
      </ContextMenuProvider>
    </div>
  );
};
