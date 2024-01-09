import type { NodeTypes } from "./types";

export const nodesMeta: Record<
  NodeTypes,
  {
    name: string;
    description: string;
    icon: string;
  }
> = {
  Start: {
    name: "Start",
    description: "Start node of the workflow",
    icon: "power",
  },
  Log: {
    name: "Log",
    description: "Log node for debugging",
    icon: "bug",
  },
  TextNode: {
    name: "Text",
    description: "Node for handling text",
    icon: "text",
  },
  Number: {
    name: "Number",
    description: "Node for handling numbers",
    icon: "numbers",
  },
  PromptTemplate: {
    name: "Prompt Template",
    description: "Template for user prompts",
    icon: "text-select",
  },
  OpenAIFunctionCall: {
    name: "OpenAI Function Call",
    description: "Node for making OpenAI function calls",
    icon: "openAI",
  },
  ComposeObject: {
    name: "Compose Object",
    description: "Node for composing objects",
    icon: "braces",
  },
  InputNode: {
    name: "Input",
    description: "Node for handling inputs",
    icon: "input",
  },
  OutputNode: {
    name: "Output",
    description: "Node for handling outputs",
    icon: "output",
  },
  ModuleNode: {
    name: "Module Node",
    description: "Node for handling module nodes",
    icon: "component",
  },
  Replicate: {
    name: "Replicate",
    description: "For using Replicate API",
    icon: "box-select",
  },
  GoogleSheet: {
    name: "Google Sheet",
    description: "Google sheet as datasource",
    icon: "googleSheet",
  },
  Shopify: {
    name: "Shopify",
    description: "Shopify as datasource",
    icon: "shopify",
  },
  Webflow: {
    name: "Webflow",
    description: "Webflow as datasource",
    icon: "webflow",
  },
  Wordpress: {
    name: "Wordpress",
    description: "Wordpress as datasource",
    icon: "wordpress",
  },
  Postgres: {
    name: "Postgresql",
    description: "Postgresql as datasource",
    icon: "postgres",
  },
};
