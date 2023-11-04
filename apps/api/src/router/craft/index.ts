import { createTRPCRouter } from "../../trpc";
import { craftEdgeRouter } from "./edge";
import { craftExecutionRouter } from "./execution";
import { craftModuleRouter } from "./module";
import { craftNodeRouter } from "./node";
import { craftVersionRouter } from "./version";

export const craftRouter = createTRPCRouter({
  edge: craftEdgeRouter,
  node: craftNodeRouter,
  execution: craftExecutionRouter,
  version: craftVersionRouter,
  module: craftModuleRouter,
});
