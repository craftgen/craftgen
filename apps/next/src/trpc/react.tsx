"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";
import {
  loggerLink,
  splitLink,
  unstable_httpBatchStreamLink,
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@craftgen/ipc-api";

import { getUrl, transformer } from "./shared";

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider(props: {
  children: React.ReactNode;
  headers: Headers;
}) {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          // enabled: () => false,
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        splitLink({
          condition: (op) => {
            return op.path.startsWith("primary");
          },
          true: unstable_httpBatchStreamLink({
            url: getUrl(),
            transformer,
            headers() {
              const heads = new Map(props.headers);
              console.log("HEADS", heads);
              heads.set("x-trpc-source", "react");
              return Object.fromEntries(heads);
            },
          }),
          false: unstable_httpBatchStreamLink({
            url: getUrl(),
            transformer,
            headers() {
              const heads = new Map(props.headers);
              console.log("HEADS", heads);
              heads.set("x-trpc-source", "react");
              return Object.fromEntries(heads);
            },
          }),
        }),
      ],
    }),
  );
  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryStreamedHydration transformer={superjson}>
          {props.children}
        </ReactQueryStreamedHydration>
      </QueryClientProvider>
    </api.Provider>
  );
}
