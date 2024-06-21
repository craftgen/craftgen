import { createTRPCRouter } from "../../trpc";
import { integrationRouter } from "./integration";
import { miscRouter } from "./misc";
import { solutionRouter } from "./solution";

export const publicRouter = createTRPCRouter({
  integration: integrationRouter,
  solution: solutionRouter,
  misc: miscRouter,
});
