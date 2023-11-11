import { createTRPCRouter } from "../../trpc";
import { assistantRouter } from "./assistant";
import { threadRouter } from "./thread";

export const openaiRouter = createTRPCRouter({
  assistant: assistantRouter,
  tread: threadRouter,
});
