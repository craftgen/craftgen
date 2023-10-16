"use client";

import { saveEdge } from "@/actions/create-edge";
import { deleteEdge } from "@/actions/delete-edge";
import { deleteNode } from "@/actions/delete-node";
import { getWorkflow } from "@/actions/get-workflow";
import { updateNodeMeta } from "@/actions/update-node-meta";
import { upsertNode } from "@/actions/upsert-node";

import { useToast } from "@/components/ui/use-toast";
import { ResultOfAction } from "@/lib/type";
import { debounce } from "lodash-es";
import { Shrink, Lock } from "lucide-react";
import { useMemo, useCallback, useEffect } from "react";
import { useRete } from "rete-react-plugin";
import { match } from "ts-pattern";
import { ContextMenuProvider } from "./context-menu";
import { createEditorFunc } from "./editor";
import { useCraftStore } from "./use-store";
import { getConnectionSockets } from "./utils";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  const { toast } = useToast();

  const fn = debounce(updateNodeMeta, 500);
  const updateMeta = useCallback(
    async (params: {
      id: string;
      position?: { x: number; y: number };
      size?: { width: number; height: number };
    }) => {
      return fn(params);
    },
    []
  );

  useEffect(() => {
    rete?.area.addPipe((context) => {
      match(context)
        .with({ type: "noderesized" }, ({ data }) => {
          console.log("noderesized", { data });
          const size = {
            width: Math.round(data.size.width),
            height: Math.round(data.size.height),
          };
          di?.editor.getNode(data.id).setSize(size);
          updateMeta({ id: data.id, size });
        })
        .with({ type: "nodetranslated" }, ({ data }) => {
          if (
            data.position.x !== data.previous.y ||
            data.position.y !== data.previous.y
          ) {
            updateMeta(data);
          }
        });

      return context;
    });
  }, [rete]);
  const workflowVersionId = useMemo(() => {
    return workflow.versions[0].id;
  }, [workflow.versions]);

  useEffect(() => {
    rete?.editor.addPipe((context) => {
      match(context)
        .with({ type: "connectioncreate" }, ({ data }) => {
          const { source, target } = getConnectionSockets(di?.editor!, data);
          if (target && !source.isCompatibleWith(target)) {
            console.log("Sockets are not compatible", "error");
            toast({
              title: "Sockets are not compatible",
              description: (
                <span>
                  Socket <Badge> {source.name} </Badge> is not compatible with{" "}
                  <Badge>{target.name} </Badge>
                </span>
              ),
            });
          }
        })
        .with({ type: "nodecreated" }, async ({ data }) => {
          const size = data.size;
          await upsertNode({
            workflowId: workflow.id,
            workflowVersionId,
            projectId: workflow.project.id,
            data: {
              id: data.id,
              type: data.ID,
              color: "default",
              label: data.label,
              contextId: data.contextId,
              context: JSON.stringify(data.actor.getSnapshot().context),
              position: { x: 0, y: 0 }, // When node is created it's position is 0,0 and it's moved later on.
              ...size,
            },
          });
        })
        .with({ type: "noderemove" }, async ({ data }) => {
          console.log("noderemove", { data });
          await deleteNode({
            workflowId: workflow.id,
            workflowVersionId,
            data: {
              id: data.id,
            },
          });
        })
        .with({ type: "connectioncreated" }, async ({ data }) => {
          console.log("connectioncreated", { data });
          await saveEdge({
            workflowId: workflow.id,
            workflowVersionId,
            data: JSON.parse(JSON.stringify(data)),
          });
          try {
            await di?.editor.getNode(data.target).data(); // is this about connecttinos.
          } catch (e) {
            console.log("Failed to update", e);
          }
        })
        .with({ type: "connectionremoved" }, async ({ data }) => {
          console.log("connectionremoved", { data });
          await deleteEdge({
            workflowId: workflow.id,
            workflowVersionId,
            data: JSON.parse(JSON.stringify(data)),
          });
        });

      return context;
    });
  }, [rete]);
  return (
    <div className="w-full h-full">
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
