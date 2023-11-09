import { createTRPCRouter } from "../../trpc";
import { craftEdgeRouter } from "./edge";
import { craftExecutionRouter } from "./execution";
import { craftModuleRouter } from "./module";
import { craftNodeRouter } from "./node";
import { craftVariablesRouter } from "./variables";
import { craftVersionRouter } from "./version";

export const craftRouter = createTRPCRouter({
  edge: craftEdgeRouter,
  node: craftNodeRouter,
  execution: craftExecutionRouter,
  version: craftVersionRouter,
  module: craftModuleRouter,
  variables: craftVariablesRouter,
});
