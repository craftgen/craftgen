import { createTRPCRouter } from "../../trpc";
import { integrationRouter } from "./integration";
import { solutionRouter } from "./solution";

export const publicRouter = createTRPCRouter({
  integration: integrationRouter,
  solution: solutionRouter,
});
