"use client";

import { ResultOfAction } from "@/lib/type";
import { getWorkflow } from "../../action";
import useSWR from "swr";
import { getLogs } from "./actions";
import { Separator } from "@/components/ui/separator";

export const LogsTab: React.FC<{
  workflow: ResultOfAction<typeof getWorkflow>;
}> = ({ workflow }) => {
  const { data, error } = useSWR("/api/executions", () =>
    getLogs({
      worfklowId: workflow.id,
      workflowVersionId: workflow.version.id,
    }).then((res) => res.data)
  );
  console.log(data, error);
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
                <li key={nodeData.id} className="my-2">
                  <h2 className="font-bold">{nodeData.type}</h2>
                  <div className="grid grid-cols-2">
                    <div>
                      <pre className="break-all">
                        {JSON.stringify(nodeData.state.context.inputs, null, 2)}
                      </pre>
                      <pre>
                        {JSON.stringify(
                          nodeData.state.context.settings,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                    <div>
                      <pre>
                        {JSON.stringify(
                          nodeData.state.context.outputs,
                          null,
                          2
                        )}
                      </pre>
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
