import { createTRPCRouter } from "../../trpc.ts";
import { orgRouter } from "./org.ts";

export const platformRouter = createTRPCRouter({
  orgs: orgRouter,
});
