import { Button } from "@/components/ui/button";
import { DragEventHandler } from "react";
import { NodeTypes } from "./nodes";

export const Toolbar = () => {
  const onDragStart = (event: any, nodeType: NodeTypes) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="bg-accent shadow m-2 p-2 rounded w-full absolute top-4 flex flex-row items-center justify-start space-x-2 max-w-lg">
      <Button
        onDragStart={(event) => onDragStart(event, "FunctionCallingNode")}
        draggable
      >
        Function
      </Button>
      <Button
        onDragStart={(event) => onDragStart(event, "DataSetSourceNode")}
        draggable
      >
        Dataset
      </Button>
      <Button>Prompt</Button>
      <Button>Article</Button>
    </div>
  );
};
