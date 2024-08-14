import { createTRPCRouter } from "../../trpc";
import { stripeConnectRouter } from "./connect";

export const stripeRouter = createTRPCRouter({
  connect: stripeConnectRouter,
});
