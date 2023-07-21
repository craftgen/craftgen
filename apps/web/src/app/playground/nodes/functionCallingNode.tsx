import { useCallback } from "react";
import { Handle, NodeProps, Position } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";

const handleStyle = { left: 10 };

type FunctionCallingNodeData = {
  text: string
}  

export const functionCallingNode:  React.FC<NodeProps<FunctionCallingNodeData>> = ({}) => {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Card>
       <CardContent>
        <label htmlFor="text">Text:</label>
        <input id="text" name="text" onChange={onChange} className="nodrag" />
        </CardContent> 
      </Card>
      <Handle type="source" position={Position.Bottom} id="a" />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        style={handleStyle}
      />
    </>
  );
};
