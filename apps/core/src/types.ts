import { GetSchemes, NodeEditor } from "rete";
import * as z from "zod";
import { Structures } from "rete-structures/_types/types";

import { Connection } from "./connection/connection";
import {
  Log,
  OpenAIFunctionCall,
  PromptTemplate,
  Start,
  TextNode,
  Number,
  ComposeObject,
  Article,
  InputNode,
  OutputNode,
  ModuleNode,
  Shopify,
  Webflow,
  Wordpress,
  Postgres,
  Replicate,
  GoogleSheet,
} from "./nodes";
import { ControlFlowEngine, DataflowEngine } from "./engine";
import { Modules } from "./modules";

export const nodes = {
  Start: Start,
  Log: Log,
  TextNode: TextNode,
  Number: Number,
  PromptTemplate: PromptTemplate,
  OpenAIFunctionCall: OpenAIFunctionCall,

  ComposeObject: ComposeObject,
  Article: Article,

  InputNode,
  OutputNode,
  ModuleNode,

  Replicate: Replicate,

  // DataSources
  GoogleSheet: GoogleSheet,
  Shopify: Shopify,
  Webflow: Webflow,
  Wordpress: Wordpress,
  Postgres: Postgres,
} as const;

type ValueOf<T> = T[keyof T];
export type NodeTypes = ValueOf<{
  [Property in keyof typeof nodes as string]: Property;
}>;

export type NodeProps =
  | Start
  | Log
  | TextNode
  | Number
  | PromptTemplate
  | OpenAIFunctionCall
  | ComposeObject
  | Article
  | InputNode
  | OutputNode
  | ModuleNode
  | Replicate
  | GoogleSheet
  | Shopify
  | Webflow
  | Wordpress
  | Postgres;

export type ConnProps = Connection<NodeProps, NodeProps>;
export type Schemes = GetSchemes<NodeProps, ConnProps>;

export type Position = { x: number; y: number };
export type Rect = { left: number; top: number; right: number; bottom: number };

export const updateExecutionNodeParamSchema = z.object({
  id: z.string(),
  state: z.string(),
});
export const setContextParamSchema = z.object({
  contextId: z.string(),
  context: z.string(),
});

export interface WorkflowAPI {
  updateExecutionNode: (
    params: z.infer<typeof updateExecutionNodeParamSchema>
  ) => Promise<void>;
  setContext: (params: z.infer<typeof setContextParamSchema>) => Promise<void>;
}

export type DiContainer = {
  headless: boolean;
  logger: any; // TODO: fix types
  graph: Structures<NodeProps, ConnProps>;
  editor: NodeEditor<Schemes>;
  engine: ControlFlowEngine<Schemes>;
  dataFlow: DataflowEngine<Schemes>;
  modules: Modules;
  api: WorkflowAPI;
};
