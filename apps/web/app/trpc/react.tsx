import { QueryClient } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  loggerLink,
  unstable_httpBatchStreamLink,
} from "@trpc/client";
import { createTRPCQueryUtils, createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@craftgen/ipc-api";

import { getUrl } from "./shared";

// export const queryClient = new QueryClient();

// export const trpc = createTRPCReact<AppRouter>({});
// export const trpcClient = trpc.createClient({
//   links: [
//     loggerLink({
//       // enabled: () => false,
//       enabled: (op) =>
//         process.env.NODE_ENV === "development" ||
//         (op.direction === "down" && op.result instanceof Error),
//     }),
//     unstable_httpBatchStreamLink({
//       url: getUrl(),
//       transformer: superjson,
//       async headers() {
//         const heads = new Headers();
//         if (typeof window === "undefined") {
//           const { getCookie } = await import("vinxi/http");
//           const authToken = getCookie("craftgen-jwt");
//           if (authToken) {
//             heads.set("authorization", `Bearer ${authToken}`);
//           }
//         }
//         return Object.fromEntries(heads);
//       },
//       fetch(url, options) {
//         return fetch(url, {
//           ...options,
//           credentials: "include",
//         });
//       },
//     }),
//   ],
// });

// export const trpcQueryUtils = createTRPCQueryUtils<AppRouter>({
//   queryClient,
//   client: trpcClient,
// });

// export const client = createTRPCClient<AppRouter>({
//   links: [
//     loggerLink({
//       // enabled: () => false,
//       enabled: (op) =>
//         process.env.NODE_ENV === "development" ||
//         (op.direction === "down" && op.result instanceof Error),
//     }),
//     httpBatchLink({
//       url: getUrl(),
//       transformer: superjson,
//       headers() {
//         const heds = new Headers();
//         heds.set("x-trpc-source", "web");
//         return Object.fromEntries(heds);
//       },
//       fetch(url, options) {
//         return fetch(url, {
//           ...options,
//           credentials: "include",
//         });
//       },
//     }),
//   ],
// });
