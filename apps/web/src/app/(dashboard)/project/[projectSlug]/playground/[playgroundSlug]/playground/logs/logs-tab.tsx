"use client";

import { ResultOfAction } from "@/lib/type";
import { getWorkflow } from "../../action";
import useSWR from "swr";
import { getLogs } from "./actions";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useCraftStore } from "../use-store";

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
      refreshInterval: 1000,
    }
  );
  const di = useCraftStore((state) => state.di);

  return (
    <div className="p-4">
      <h1>Logs</h1>
      {data?.executions.map((execution) => (
        <div key={execution.id}>
          <Separator />
          <div key={execution.id}>
            <h3>{execution.id}</h3>
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
