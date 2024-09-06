import { createTRPCRouter } from "../../../trpc.ts";
import { craftModuleRouter } from "./module.ts";
// import { craftEdgeRouter } from "./edge.ts";
// import { craftExecutionRouter } from "./execution.ts";
import { craftNodeRouter } from "./node.ts";

// import { craftVersionRouter } from "./version.ts";

export const craftRouter = createTRPCRouter({
  // edge: craftEdgeRouter,
  node: craftNodeRouter,
  // execution: craftExecutionRouter,
  // version: craftVersionRouter,
  module: craftModuleRouter,
});
