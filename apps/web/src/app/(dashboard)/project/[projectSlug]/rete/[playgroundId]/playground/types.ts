import { GetSchemes } from "rete";
import { Connection } from "./connection";
import { Log, PromptTemplate, Start, TextNode } from "./nodes";

export type NodeProps = 
  | Start | Log | TextNode | PromptTemplate
export type ConnProps =
  | Connection<Start, Log> 
  | Connection<TextNode, Log>
export type Schemes = GetSchemes<NodeProps, ConnProps>;