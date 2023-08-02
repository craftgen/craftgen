import { GetSchemes } from "rete";
import { Connection } from "./connection";
import {
  Log,
  OpenAIFunctionCall,
  PromptTemplate,
  Start,
  TextNode,
  FunctionNode,
  DataSource,
} from "./nodes";

export type NodeProps =
  | Start
  | Log
  | TextNode
  | PromptTemplate
  | OpenAIFunctionCall
  | FunctionNode
  | DataSource;
export type ConnProps = Connection<Start, Log> | Connection<TextNode, Log>;
export type Schemes = GetSchemes<NodeProps, ConnProps>;
