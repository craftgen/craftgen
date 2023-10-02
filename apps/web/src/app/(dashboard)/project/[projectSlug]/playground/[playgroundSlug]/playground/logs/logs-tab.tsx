import { ResultOfAction } from "@/lib/type";
import { getWorkflow } from "../../action";

export const LogsTab: React.FC<{
  workflow: ResultOfAction<typeof getWorkflow>;
}> = () => {
  return (
    <div>
      <h1>Logs</h1>
    </div>
  );
};
