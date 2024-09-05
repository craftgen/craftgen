import { createTRPCRouter } from "../../trpc.ts";
import { craftRouter } from "./craft/index.ts";
import { orgRouter } from "./org.ts";

export const platformRouter = createTRPCRouter({
  orgs: orgRouter,
  craft: craftRouter,
});
