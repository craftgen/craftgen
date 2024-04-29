import type { CreateTRPCProxyClient } from "@trpc/client";
import type { GetSchemes } from "rete";
import type { Constructor } from "type-fest";
import type { AnyStateMachine } from "xstate";
import * as z from "zod";

import type { AppRouter } from "@seocraft/api";

import type { Editor } from ".";
import type { Connection } from "./connection/connection";
import { NodeApiConfiguration } from "./nodes/apiConfiguration";
import type { BaseNode } from "./nodes/base";
import { GoogleSearchConsole } from "./nodes/datasource/search-console/search-console";
import { NodeCompleteChat } from "./nodes/function/completeChat";
import { NodeGenerateStructure } from "./nodes/function/generateStructure";
import { NodeGenerateText } from "./nodes/function/generateText";
import { OpenAIAssistant } from "./nodes/openai/assistant";
import { OpenAIThread } from "./nodes/openai/openai-thread";
import { NodeThread } from "./nodes/thread";
import { BranchNode } from "./nodes/tools/branch";
import { IteratorNode } from "./nodes/tools/iterator";
import { NodeMath } from "./nodes/tools/math";
import { NodeReplicate } from "./nodes/replicate/replicate";
import { NodeRestApi } from "./nodes/api/rest";
import { NodeHttpRequest } from "./nodes/api/http-request";
import { NodeOllama } from "./nodes/ollama/ollama";
import { Start } from "./nodes/start";
import { Log } from "./nodes/log";
import { NodeText } from "./nodes/primitives/text";
import { NodeJavascriptCodeInterpreter } from "./nodes/interpreter/js";
import { NodeModule } from "./nodes/io/module";
import { NodeComposeObject } from "./nodes/object/composeObject";
import { NodeOpenAI } from "./nodes/openai/openai";
import { NodeNumber } from "./nodes/primitives/number";
import { NodePromptTemplateData } from "./nodes/prompt-template";

interface NodeTypeStatic {
  new (...args: any[]): any; // constructor signature
  nodeType: string;
  label: string;
  description: string;
  icon: string;
  section?: string;
  machines: Record<string, AnyStateMachine>;
}

export type NodeClass = Constructor<BaseNode<AnyStateMachine, any, any, any>> &
  NodeTypeStatic;

export interface Node {
  type: string;
  id: string;
  contextId: string;

  projectId?: string;
  workflowId?: string;
  workflowVersionId?: string;

  executionId?: string;
  executionNodeId?: string;

  position?: Position;
  width?: number;
  height?: number;
  label: string;
  description?: string;
  color?: string;
}

export const nodes = {
  Start: Start,
  NodeLog: Log,
  NodeText: NodeText,
  NodeNumber: NodeNumber,
  NodePromptTemplate: NodePromptTemplate,
  NodeThread: NodeThread,

  // Tools
  NodeIterator: IteratorNode,
  NodeBranch: BranchNode,
  NodeMath: NodeMath,

  // Models
  NodeOllama: NodeOllama,
  NodeOpenAI: NodeOpenAI,

  NodeApiConfiguration: NodeApiConfiguration,

  NodeGenerateText: NodeGenerateText,
  NodeGenerateStructure: NodeGenerateStructure,
  NodeCompleteChat: NodeCompleteChat,

  NodeJavascriptCodeInterpreter: NodeJavascriptCodeInterpreter,

  // OpenAIThread: OpenAIThread,
  // OpenAIAssistant: OpenAIAssistant,

  NodeComposeObject: NodeComposeObject,

  // InputNode,
  // OutputNode,
  NodeModule: NodeModule,

  NodeReplicate: NodeReplicate,

  NodeHttpRequest: NodeHttpRequest,
  NodeRestApi: NodeRestApi,

  // // DataSources
  // GoogleSheet: GoogleSheet,
  // GoogleSearchConsole: GoogleSearchConsole,
  // Shopify: Shopify,
  // Webflow: Webflow,
  // Wordpress: Wordpress,
  // Postgres: Postgres,
} as const;

type ValueOf<T> = T[keyof T];

export const nodeTypes = Object.keys(nodes) as NodeTypes[];

export type NodeTypes = ValueOf<{
  [Property in keyof typeof nodes as string]: Property;
}>;

export type NodeProps = BaseNode<AnyStateMachine, any, any, any>;

export type ConnProps = Connection<NodeProps, NodeProps>;
export type Schemes = GetSchemes<NodeProps, ConnProps>;

export interface Position {
  x: number;
  y: number;
}
export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const setExecutionStateParamSchema = z.object({
  id: z.string(),
  type: z.string(),
  workflowId: z.string(),
  workflowVersionId: z.string(),
  contextId: z.string(),
  workflowExecutionId: z.string(),
  projectId: z.string(),
  workflowNodeId: z.string(),
  state: z.string(),
});
export const setContextParamSchema = z.object({
  contextId: z.string(),
  context: z.string(),
});
export const checkAPIKeyExistParamSchema = z.object({
  key: z.string(),
  projectId: z.string(),
});
export const getAPIKeyParamSchema = z.object({
  projectId: z.string(),
  key: z.string(),
});

export const triggerWorkflowExecutionStepParamSchema = z.object({
  executionId: z.string(),
  workflowNodeId: z.string(),
  // workflowSlug: z.string(),
  // projectSlug: z.string(),
  // version: z.number(),
});

export const updateNodeMetadataParamSchema = z.object({
  id: z.string(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  size: z.object({ width: z.number(), height: z.number() }).optional(),
  label: z.string().optional(),
});

export const upsertNodeParamSchema = z.object({
  workflowId: z.string(),
  workflowVersionId: z.string(),
  projectId: z.string(),
  data: z.object({
    id: z.string(),
    contextId: z.string(),
    context: z.string().describe("JSON stringified context"),
    type: z.string(),
    width: z.number(),
    height: z.number(),
    color: z.string(),
    label: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
  }),
});
export const deleteNodeParamSchema = z.object({
  workflowId: z.string(),
  workflowVersionId: z.string(),
  data: z.object({
    id: z.string(),
  }),
});

export const saveEdgeParamSchema = z.object({
  workflowId: z.string(),
  workflowVersionId: z.string(),
  data: z.custom<ConnProps>(),
});

export const deleteEdgeParamSchema = z.object({
  workflowId: z.string(),
  workflowVersionId: z.string(),
  data: z.custom<ConnProps>(),
});

export const createExecutionParamSchema = z.object({
  workflowId: z.string(),
  workflowVersionId: z.string(),
  input: z.object({
    id: z.string(),
    values: z.any(),
  }),
  headless: z.boolean().optional().default(false),
});

export const getModuleParamSchema = z.object({
  versionId: z.string(),
});

export interface CreateExecutionResult {
  id: string;
}

export interface WorkflowAPI {
  trpc: CreateTRPCProxyClient<AppRouter>;
}

export type DiContainer = Editor;
