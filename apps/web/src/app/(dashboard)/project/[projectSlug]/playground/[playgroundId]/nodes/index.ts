import { DataSetSourceNode } from "./datasetSourceNode";
import { FunctionCallingNode } from "./functionCallingNode";


export const nodeTypes = {
  DataSetSourceNode,
  FunctionCallingNode,
};

export type NodeTypes = keyof typeof nodeTypes;
