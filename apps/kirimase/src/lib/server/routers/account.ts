import { getUserAuth } from "@/lib/auth/utils";
import { publicProcedure, router } from "../trpc";
import { getUserSubscriptionPlan } from "@/lib/stripe/subscription";
export const accountRouter = router({
  getUser: publicProcedure.query(async () => {
    const { session } = await getUserAuth();
    return session;
  }),
  getSubscription: publicProcedure.query(async () => {
    const sub = await getUserSubscriptionPlan();
    return sub;
  }),
});
