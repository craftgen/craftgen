import { useCallback } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

type FunctionCallingNodeData = {
  text: string;
};

export const textNodeNode: React.FC<
  NodeProps<FunctionCallingNodeData>
> = ({}) => {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <Card>
            <CardHeader>
              <h3>Text</h3>
            </CardHeader>
            <CardContent>
              <label htmlFor="text">Text:</label>
              <input
                id="text"
                name="text"
                onChange={onChange}
                className="nodrag"
              />
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <Handle type="target" position={Position.Right} />
        <ContextMenuContent>
          <ContextMenuItem>Profile</ContextMenuItem>
          <ContextMenuItem>Billing</ContextMenuItem>
          <ContextMenuItem>Team</ContextMenuItem>
          <ContextMenuItem>Subscription</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
};
