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

const nodes = {
  Start: Start,
  Log: Log,
  TextNode: TextNode,
  PromptTemplate: PromptTemplate,
  OpenAIFunctionCall: OpenAIFunctionCall,
  FunctionNode: FunctionNode,
  DataSource: DataSource,
};

type ValueOf<T> = T[keyof T];
export type NodeTypes = ValueOf<{
  [Property in keyof typeof nodes as string]: Property
}>;

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
