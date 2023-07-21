import { useCallback } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const handleStyle = { left: 10 };

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
      <Card>
        <CardHeader>
          <h3>Text</h3>
        </CardHeader>
        <CardContent>
          <label htmlFor="text">Text:</label>
          <input id="text" name="text" onChange={onChange} className="nodrag" />
        </CardContent>
      </Card>
      <Handle type="target" position={Position.Right} />
    </>
  );
};
