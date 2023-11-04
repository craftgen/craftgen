"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Trash } from "lucide-react";
import useSWR, { mutate } from "swr";

import { getLogs } from "@/actions/get-logs";
import type { getWorkflow } from "@/actions/get-workflow";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ResultOfAction } from "@/lib/type";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export const LogsTab: React.FC<{
  workflow: ResultOfAction<typeof getWorkflow>;
}> = ({ workflow }) => {
  const { data, error } = useSWR(
    "/api/executions",
    () =>
      getLogs({
        worfklowId: workflow.id,
        workflowVersionId: workflow.version.id,
      }).then((res) => res.data),
    {
      refreshInterval: 2000,
    },
  );
  return (
    <div className="p-4">
      <h1>Logs</h1>
      <Accordion type="multiple">
        {data?.executions.map((execution) => (
          <ExecutionItem key={execution.id} execution={execution} />
        ))}
      </Accordion>
    </div>
  );
};

type Execution = ResultOfAction<typeof getLogs>["executions"][number];

const ExecutionItem: React.FC<{ execution: Execution }> = ({ execution }) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutateAsync: deleteExecution } =
    api.craft.execution.delete.useMutation();
  const handleDeleteExecution = (executionId: string) => {
    deleteExecution({ executionId });
    if (isActiveView(executionId)) {
      const search = new URLSearchParams(searchParams);
      search.delete("execution");
      router.replace(`${pathname}?${search.toString()}`);
    }
    mutate("/api/executions");
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
        <div className="border p-2">
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
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{nodeData.type}</h2>
        <div>
          <Badge
            className={cn(
              "ml-2",
              nodeData?.state?.status === "done" && "bg-green-400",
            )}
          >
            {nodeData?.state?.status}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2">
        <div>
          <LogsTable record={nodeData?.state?.context?.inputs || {}} />
          <LogsTable record={nodeData?.state?.context?.settings || {}} />
        </div>
        <div>
          <LogsTable record={nodeData?.state?.context?.outputs || {}} />
        </div>
      </div>
    </li>
  );
};

const LogsTable: React.FC<{ record: Record<string, any> }> = ({ record }) => {
  const columns = React.useMemo(() => {
    return Object.keys(record).map((key) => ({
      Header: key,
      accessor: key,
    }));
  }, [record]);
  return (
    <div className="grid gap-2">
      {columns.map((column) => (
        <div className="even:bg-muted flex flex-row" key={column.accessor}>
          <div className="min-w-[6rem] font-bold">{column.Header}</div>
          <div className="flex-1">
            {typeof record[column.accessor] === "string" ? (
              <div>{record[column.accessor]}</div>
            ) : (
              <code>{JSON.stringify(record[column.accessor], null, 2)}</code>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
