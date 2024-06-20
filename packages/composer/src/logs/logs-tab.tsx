"use client";

import React, { useCallback, useMemo } from "react";
// import Link from "next/link";
// import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Trash } from "lucide-react";

import { RouterOutputs } from "@craftgen/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@craftgen/ui/components/accordion";
import { Badge } from "@craftgen/ui/components/badge";
import { Button } from "@craftgen/ui/components/button";
import { JSONView } from "@craftgen/ui/components/json-view";
import { Label } from "@craftgen/ui/components/label";
import { Separator } from "@craftgen/ui/components/separator";
import { Switch } from "@craftgen/ui/components/switch";
import { api } from "@craftgen/ui/lib/api";
import { cn } from "@craftgen/ui/lib/utils";

export const LogsTab: React.FC<{
  workflow: RouterOutputs["craft"]["module"]["meta"];
}> = ({ workflow }) => {
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const { data } = api.craft.execution.list.useQuery(
    {
      worfklowId: workflow.id,
      workflowVersionId: workflow.version?.id!,
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
  // const pathname = usePathname();
  // const router = useRouter();
  // const searchParams = useSearchParams();
  const utils = api.useUtils();
  const { mutateAsync: deleteExecution } =
    api.craft.execution.delete.useMutation({
      onSettled(data, error) {
        utils.craft.execution.list.invalidate();
      },
    });
  const handleDeleteExecution = (executionId: string) => {
    // deleteExecution({ executionId });
    // if (isActiveView(executionId)) {
    //   const search = new URLSearchParams(searchParams);
    //   search.delete("execution");
    //   router.replace(`${pathname}?${search.toString()}`);
    // }
  };

  // const isActiveView = useCallback(
  //   (executionId: string) => {
  //     return searchParams.get("execution") === executionId;
  //   },
  //   [searchParams.get("execution")],
  // );
  return (
    <AccordionItem value={execution.id}>
      <AccordionTrigger>
        <div className="flex w-full items-center justify-between">
          <a href={execution.url}>
            <h3>{execution.id}</h3>
          </a>
          {/* <Link href={execution.url}>
            <h3>{execution.id}</h3>
          </Link> */}
          {/* {isActiveView(execution.id) && (
            <div className="animate-pulse">Active</div>
          )} */}
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
  return (
    <li key={nodeData.id} className="my-2 rounded border p-2">
      {nodeData?.state && (
        <ExecutionActorData
          id={nodeData.id}
          actorData={nodeData?.state.snapshot}
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
        <fieldset className="grid gap-6 rounded-lg border bg-muted/50 p-4">
          <legend className="-ml-1 rounded bg-muted px-1 text-sm font-medium">
            Inputs
          </legend>
          <LogsTable record={actorData?.context?.inputs || {}} />
          {actorData?.context?.settings && (
            <LogsTable record={actorData?.context?.settings || {}} />
          )}
        </fieldset>

        <fieldset className="grid gap-6 rounded-lg border bg-muted/50 p-4">
          <legend className="-ml-1 rounded bg-muted px-1 text-sm font-medium">
            Outputs
          </legend>
          <LogsTable record={actorData?.context?.outputs || {}} />
        </fieldset>
        {runs.length > 0 && (
          <div className="col-span-2 w-full">
            <Separator />
            <div className="bg-muted/30 pt-2">
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
