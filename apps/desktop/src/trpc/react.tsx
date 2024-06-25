import {
  createTRPCClient,
  loggerLink,
  unstable_httpBatchStreamLink,
} from "@trpc/client";
import superjson from "superjson";

import type { AppRouter } from "@craftgen/api";

import { getUrl } from "./shared";

export const client = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      // enabled: () => false,
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    unstable_httpBatchStreamLink({
      url: getUrl(),
      transformer: superjson,
      headers() {
        const heds = new Headers();
        heds.set("x-trpc-source", "desktop");
        return Object.fromEntries(heds);
      },
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});
