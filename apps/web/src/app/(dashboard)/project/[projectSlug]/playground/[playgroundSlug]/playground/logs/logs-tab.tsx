"use client";

import { ResultOfAction } from "@/lib/type";
import { getWorkflow } from "../../action";
import useSWR, { mutate } from "swr";
import { deleteExecution, getLogs } from "./actions";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useCraftStore } from "../use-store";
import { Trash } from "lucide-react";
import Link from "next/link";
import { useSearchParam } from "react-use";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";

export const LogsTab: React.FC<{
  workflow: ResultOfAction<typeof getWorkflow>;
}> = ({ workflow }) => {
  const searchParams = useSearchParams();
  const { data, error } = useSWR(
    "/api/executions",
    () =>
      getLogs({
        worfklowId: workflow.id,
        workflowVersionId: workflow.version.id,
      }).then((res) => res.data),
    {
      refreshInterval: 1000,
    }
  );
  const di = useCraftStore((state) => state.di);
  const handleDeleteExecution = (executionId: string) => {
    deleteExecution({ executionId });
    mutate("/api/executions");
  };

  const isActiveView = useCallback(
    (executionId: string) => {
      return searchParams.get("execution") === executionId;
    },
    [searchParams.get("execution")]
  );

  return (
    <div className="p-4">
      <h1>Logs</h1>
      {data?.executions.map((execution) => (
        <div key={execution.id}>
          <Separator />
          <div key={execution.id}>
            <div className="flex w-full justify-between items-center">
              <Link
                href={`/${workflow.projectSlug}/${workflow.slug}/playground?execution=${execution.id}`}
              >
                <h3>{execution.id}</h3>
                {isActiveView(execution.id) && (
                  <div className="animate-pulse">Active</div>
                )}
              </Link>
              <div>
                <Button
                  size={"icon"}
                  variant={"destructive"}
                  onClick={() => handleDeleteExecution(execution.id)}
                >
                  <Trash />
                </Button>
              </div>
            </div>
            <ul className="ml-4">
              {execution.executionData.map((nodeData) => (
                <li
                  key={nodeData.id}
                  className="my-2"
                  onMouseOver={() => {
                    di?.areaControl?.nodeSelector?.select(
                      nodeData.workflowNodeId,
                      false
                    );
                    di?.areaControl?.zoomAtNodes([nodeData.workflowNodeId]);
                  }}
                  onMouseOut={() => {
                    di?.areaControl?.nodeSelector?.unselect(
                      nodeData.workflowNodeId
                    );
                    di?.areaControl?.zoomAtNodes();
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold">
                      {nodeData.type} || {nodeData.state.status}
                    </h2>
                    <div></div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div>
                      <code className="break-all">
                        {JSON.stringify(nodeData.state.context.inputs, null, 2)}
                      </code>
                      <code>
                        {JSON.stringify(
                          nodeData.state.context.settings,
                          null,
                          2
                        )}
                      </code>
                    </div>
                    <div>
                      <code>
                        {JSON.stringify(
                          nodeData.state.context.outputs,
                          null,
                          2
                        )}
                      </code>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      {/* {JSON.stringify(data, null, 2)} */}
    </div>
  );
};
