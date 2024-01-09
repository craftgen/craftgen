"use client";

import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Trash } from "lucide-react";

import type { getWorkflow } from "@/actions/get-workflow";
import { JSONView } from "@/components/json-view";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { ResultOfAction } from "@/lib/type";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { RouterOutputs } from "@/trpc/shared";

export const LogsTab: React.FC<{
  workflow: ResultOfAction<typeof getWorkflow>;
}> = ({ workflow }) => {
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const { data } = api.craft.execution.list.useQuery(
    {
      worfklowId: workflow.id,
      workflowVersionId: workflow.version.id,
    },
    {
      enabled: !!workflow,
      refetchInterval: () => (autoRefresh ? 3000 : false),
    },
  );
  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1>Logs</h1>
        <div className="flex items-center space-x-2">
          <Switch
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
          />
          <Label htmlFor="auto-refresh">Auto Fetch</Label>
        </div>
      </div>
      <Accordion type="multiple">
        {data?.executions.map((execution) => (
          <ExecutionItem key={execution.id} execution={execution} />
        ))}
      </Accordion>
    </div>
  );
};

type Execution =
  RouterOutputs["craft"]["execution"]["list"]["executions"][number];

const ExecutionItem: React.FC<{ execution: Execution }> = ({ execution }) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const { mutateAsync: deleteExecution } =
    api.craft.execution.delete.useMutation({
      onSettled(data, error) {
        utils.craft.execution.list.invalidate();
      },
    });
  const handleDeleteExecution = (executionId: string) => {
    deleteExecution({ executionId });
    if (isActiveView(executionId)) {
      const search = new URLSearchParams(searchParams);
      search.delete("execution");
      router.replace(`${pathname}?${search.toString()}`);
    }
  };

  const isActiveView = useCallback(
    (executionId: string) => {
      return searchParams.get("execution") === executionId;
    },
    [searchParams.get("execution")],
  );
  return (
    <AccordionItem value={execution.id}>
      <AccordionTrigger>
        <div className="flex w-full items-center justify-between">
          <Link href={execution.url}>
            <h3>{execution.id}</h3>
          </Link>
          {isActiveView(execution.id) && (
            <div className="animate-pulse">Active</div>
          )}
          <div>
            <Button
              size={"icon"}
              variant={"ghost"}
              onClick={() => handleDeleteExecution(execution.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="">
          <ul className="ml space-y-2">
            {execution.executionData.map((nodeData) => (
              <ExecutionNodeItem key={nodeData.id} nodeData={nodeData} />
            ))}
          </ul>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

type NodeState = Execution["executionData"][number];

const ExecutionNodeItem: React.FC<{
  nodeData: NodeState;
}> = ({ nodeData }) => {
  console.log("@@", nodeData);
  return (
    <li key={nodeData.id} className="my-2 rounded border p-2">
      {nodeData?.state && (
        <ExecutionActorData
          id={nodeData.id}
          actorData={nodeData?.state}
          type={nodeData.type}
        />
      )}
    </li>
  );
};

export const ExecutionActorData: React.FC<{
  id: string;
  type: string;
  actorData: NonNullable<Execution["executionData"][number]["state"]>;
}> = ({ id, actorData, type }) => {
  const runs = useMemo(() => {
    if (!actorData?.children) {
      return [];
    }
    return Object.entries(actorData?.children)
      .filter(([actorId]) => actorId.startsWith("call"))
      .map(([callId, child]) => {
        return { id: callId, ...child };
      });
  }, [actorData?.children]);
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 py-1">
          <h2 className="font-bold">{type}</h2>
          <Separator orientation="vertical" />
          <span className="text-muted-foreground">{id}</span>
          <Separator orientation="vertical" />
          <span className="text-muted-foreground">
            {JSON.stringify(actorData?.value)}
          </span>
        </div>
        <div>
          <Badge
            className={cn(
              "ml-2",
              actorData.status === "done" && "bg-green-400",
            )}
          >
            {actorData.status}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded border p-2">
          <h5 className="font-bold">Inputs</h5>
          <LogsTable record={actorData?.context?.inputs || {}} />
          {actorData?.context?.settings && (
            <LogsTable record={actorData?.context?.settings || {}} />
          )}
        </div>
        <div className="rounded border p-2">
          <h5 className="font-bold">Outputs</h5>
          <LogsTable record={actorData?.context?.outputs || {}} />
        </div>
        {runs.length > 0 && (
          <div className="col-span-2 w-full">
            <Separator />
            <div className="pt-2">
              <h3>Runs</h3>
              <ul className="ml space-y-2 rounded border p-2">
                {runs.map((run) => (
                  <ExecutionActorData
                    key={run.id}
                    id={run.id}
                    actorData={run.snapshot}
                    type={run.src}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LogsTable: React.FC<{ record: Record<string, any> }> = ({ record }) => {
  return (
    <div className="grid gap-2">
      <JSONView src={record} />
    </div>
  );
};
