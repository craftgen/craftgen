import { QueryClient } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  loggerLink,
  unstable_httpBatchStreamLink,
} from "@trpc/client";
import { createTRPCQueryUtils, createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import { getCookie, parseCookies } from "vinxi/http";

import type { AppRouter } from "@craftgen/ipc-api";

import { getUrl } from "./shared";

export const queryClient = new QueryClient();

export const trpc = createTRPCReact<AppRouter>({});
export const trpcClient = trpc.createClient({
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
        const heads = new Headers();
        const authToken = getCookie("craftgen-jwt");
        if (authToken) {
          heads.set("authorization", `Bearer ${authToken}`);
        }
        // console.log("COOKIES in headers", cookies);
        // Object.entries(cookies).forEach(([key, value]) => {
        //   heads.set("cookie", `${key}=${value}`);
        // });

        // heads.set("cookie", cookies.toString());

        // heads.set("cookie", `${key}=${value}`);
        return Object.fromEntries(heads);
      },
      fetch(url, options) {
        console.log("@".repeat(100));
        console.log("fetch", url, options);
        if (typeof window !== "undefined") {
          const cookies = parseCookies();
          console.log("COOKIES", cookies);
          return fetch(url, {
            ...options,
            headers: {
              ...options?.headers,
              // cookie: cookies,
            },
          });
        }

        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});

export const trpcQueryUtils = createTRPCQueryUtils<AppRouter>({
  queryClient,
  client: trpcClient,
});

export const client = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      // enabled: () => false,
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    httpBatchLink({
      url: getUrl(),
      transformer: superjson,
      headers() {
        const heds = new Headers();
        heds.set("x-trpc-source", "web");
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
