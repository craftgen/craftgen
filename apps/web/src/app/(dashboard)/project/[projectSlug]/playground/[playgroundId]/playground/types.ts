import { GetSchemes } from "rete";
import { Connection } from "./connection/connection";
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
  ComposeObject,
  Article,
  Input,
  Output,
  ModuleNode,
} from "./nodes";
import { Icon, Icons } from "@/components/icons";
import { Replicate } from "./nodes/replicate";

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

  ComposeObject: ComposeObject,
  Article: Article,

  Input: Input,
  Output: Output,
  ModuleNode: ModuleNode,

  Replicate: Replicate,
} as const;

export const nodesMeta: Record<
  keyof typeof nodes,
  {
    name: string;
    description: string;
    icon: Icon;
  }
> = {
  Start: {
    name: "Start",
    description: "Start node of the workflow",
    icon: Icons.power,
  },
  Log: {
    name: "Log",
    description: "Log node for debugging",
    icon: Icons.bug,
  },
  TextNode: {
    name: "Text Node",
    description: "Node for handling text",
    icon: Icons.text,
  },
  PromptTemplate: {
    name: "Prompt Template",
    description: "Template for user prompts",
    icon: Icons["text-select"],
  },
  OpenAIFunctionCall: {
    name: "OpenAI Function Call",
    description: "Node for making OpenAI function calls",
    icon: Icons.openAI,
  },
  DataSource: {
    name: "Data Source",
    description: "Node for handling data sources",
    icon: Icons.database,
  },
  DatabaseDelete: {
    name: "Database Delete",
    description: "Node for deleting data from the database",
    icon: Icons["box-select"],
  },
  DatabaseInsert: {
    name: "Database Insert",
    description: "Node for inserting data into the database",
    icon: Icons["box-select"],
  },
  DatabaseSelect: {
    name: "Database Select",
    description: "Node for selecting data from the database",
    icon: Icons["box-select"],
  },
  DatabaseUpdate: {
    name: "Database Update",
    description: "Node for updating data in the database",
    icon: Icons["box-select"],
  },
  DatabaseUpsert: {
    name: "Database Upsert",
    description: "Node for upserting data in the database",
    icon: Icons["box-select"],
  },
  ComposeObject: {
    name: "Compose Object",
    description: "Node for composing objects",
    icon: Icons.braces,
  },
  Article: {
    name: "Article",
    description: "Node for handling articles",
    icon: Icons.newspaper,
  },
  Input: {
    name: "Input",
    description: "Node for handling inputs",
    icon: Icons.input,
  },
  Output: {
    name: "Output",
    description: "Node for handling outputs",
    icon: Icons.output,
  },
  ModuleNode: {
    name: "Module Node",
    description: "Node for handling module nodes",
    icon: Icons.component,
  },
  Replicate: {
    name: "Replicate",
    description: "For using Replicate API",
    icon: Icons["box-select"],
  },
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
  | DatabaseUpsert
  | ComposeObject
  | Article
  | Input
  | Output
  | ModuleNode;

export type ConnProps = Connection<Start, Log> | Connection<TextNode, Log>;
export type Schemes = GetSchemes<NodeProps, ConnProps>;

export type Position = { x: number; y: number };
export type Rect = { left: number; top: number; right: number; bottom: number };
