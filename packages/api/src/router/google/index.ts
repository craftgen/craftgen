import { createTRPCRouter } from "../../trpc";
import { searchConsoleRouter } from "./searchconsole";

export const googleRouter = createTRPCRouter({
  searchConsole: searchConsoleRouter,
});
