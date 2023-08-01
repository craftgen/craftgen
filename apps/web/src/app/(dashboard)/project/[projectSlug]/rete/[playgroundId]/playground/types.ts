import { GetSchemes } from "rete";
import { Connection } from "./connection";
import {
  Log,
  OpenAIFunctionCall,
  PromptTemplate,
  Start,
  TextNode,
  FunctionNode
} from "./nodes";

export type NodeProps =
  | Start
  | Log
  | TextNode
  | PromptTemplate
  | OpenAIFunctionCall
  | FunctionNode;
export type ConnProps = Connection<Start, Log> | Connection<TextNode, Log>;
export type Schemes = GetSchemes<NodeProps, ConnProps>;
