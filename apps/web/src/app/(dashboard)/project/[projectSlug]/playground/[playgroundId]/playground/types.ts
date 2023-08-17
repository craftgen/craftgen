import { GetSchemes } from "rete";
import { Connection } from "./connection";
import {
  Log,
  OpenAIFunctionCall,
  PromptTemplate,
  Start,
  TextNode,
  DataSource,
  DatabaseDelete,
  DatabaseInsert,
  DatabaseSelect,
  DatabaseUpdate,
  DatabaseUpsert,
} from "./nodes";

export const nodes = {
  Start: Start,
  Log: Log,
  TextNode: TextNode,
  PromptTemplate: PromptTemplate,
  OpenAIFunctionCall: OpenAIFunctionCall,
  DataSource: DataSource,

  DatabaseDelete: DatabaseDelete,
  DatabaseInsert: DatabaseInsert,
  DatabaseSelect: DatabaseSelect,
  DatabaseUpdate: DatabaseUpdate,
  DatabaseUpsert: DatabaseUpsert,
};

type ValueOf<T> = T[keyof T];
export type NodeTypes = ValueOf<{
  [Property in keyof typeof nodes as string]: Property;
}>;

export type NodeProps =
  | Start
  | Log
  | TextNode
  | PromptTemplate
  | OpenAIFunctionCall
  | DataSource
  | DatabaseDelete
  | DatabaseInsert
  | DatabaseSelect
  | DatabaseUpdate
  | DatabaseUpsert;

export type ConnProps = Connection<Start, Log> | Connection<TextNode, Log>;
export type Schemes = GetSchemes<NodeProps, ConnProps>;
