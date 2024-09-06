import { createTRPCRouter } from "../../trpc.ts";
import { craftRouter } from "./craft/index.ts";
import { credentialsRouter } from "./creadentials/index.ts";
import { orgRouter } from "./org.ts";

export const tenantRouter = createTRPCRouter({
  orgs: orgRouter,
  craft: craftRouter,
  credentials: credentialsRouter,
});
