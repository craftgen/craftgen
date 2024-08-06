import { useMemo } from "react";
import { useSelector } from "@xstate/react";

import { InspectorNode } from "./components/inspector-node";
import { useCraftStore } from "./use-store";

export const InspectorWindow: React.FC<{}> = () => {
  const di = useCraftStore((state) => state.di);
  const selectedNodeId = useSelector(
    di?.actor,
    (state) => state?.context?.selectedNodeId,
  );
  const selectedNode = useMemo(() => di?.selectedNode, [selectedNodeId]);

  return (
    <>
      {selectedNode ? (
        <InspectorNode node={selectedNode} />
      ) : (
        <div className="my-auto flex h-full w-full flex-1 flex-col items-center justify-center">
          <div className="border-spacing-3 border border-dashed  p-4 py-6 font-sans text-xl font-bold text-muted-foreground">
            Select a node to inspect
          </div>
        </div>
      )}
    </>
  );
};
