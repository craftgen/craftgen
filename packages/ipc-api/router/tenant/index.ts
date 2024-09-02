import { createTRPCRouter } from "../../trpc.ts";
import { orgRouter } from "./org.ts";

export const tenantRouter = createTRPCRouter({
  orgs: orgRouter,
});
