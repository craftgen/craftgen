import { GetSchemes } from "rete";
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
  Input,
  Output,
  ModuleNode,
  Shopify,
  Webflow,
  Wordpress,
  Postgres,
} from "./nodes";
import { Icon, Icons } from "@/components/icons";
import { Replicate } from "./nodes/replicate";
import { GoogleSheet } from "./nodes/datasource/google-sheet/google-sheet";

export const nodes = {
  Start: Start,
  Log: Log,
  TextNode: TextNode,
  Number: Number,
  PromptTemplate: PromptTemplate,
  OpenAIFunctionCall: OpenAIFunctionCall,

  ComposeObject: ComposeObject,
  Article: Article,

  Input: Input,
  Output: Output,
  ModuleNode: ModuleNode,

  Replicate: Replicate,

  // DataSources
  GoogleSheet: GoogleSheet,
  Shopify: Shopify,
  Webflow: Webflow,
  Wordpress: Wordpress,
  Postgres: Postgres,
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
    name: "Text",
    description: "Node for handling text",
    icon: Icons.text,
  },
  Number: {
    name: "Number",
    description: "Node for handling numbers",
    icon: Icons.numbers,
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
  GoogleSheet: {
    name: "Google Sheet",
    description: "Google sheet as datasource",
    icon: Icons.googleSheet,
  },
  Shopify: {
    name: "Shopify",
    description: "Shopify as datasource",
    icon: Icons.shopify,
  },
  Webflow: {
    name: "Webflow",
    description: "Webflow as datasource",
    icon: Icons.webflow,
  },
  Wordpress: {
    name: "Wordpress",
    description: "Wordpress as datasource",
    icon: Icons.wordpress,
  },
  Postgres: {
    name: "Postgresql",
    description: "Postgresql as datasource",
    icon: Icons.postgres,
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
  | Number
  | PromptTemplate
  | OpenAIFunctionCall
  | ComposeObject
  | Article
  | Input
  | Output
  | ModuleNode
  | Replicate
  | GoogleSheet
  | Shopify
  | Webflow
  | Wordpress
  | Postgres;

export type ConnProps = Connection<Start, Log> | Connection<TextNode, Log>;
export type Schemes = GetSchemes<NodeProps, ConnProps>;

export type Position = { x: number; y: number };
export type Rect = { left: number; top: number; right: number; bottom: number };
