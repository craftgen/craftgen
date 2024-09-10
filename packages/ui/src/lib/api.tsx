import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loggerLink, unstable_httpBatchStreamLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@craftgen/ipc-api";

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider(props: {
  children: React.ReactNode;
  headers: Headers;
  url: string;
  fetch?: (url: string, options?: RequestInit) => Promise<Response>;
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
        unstable_httpBatchStreamLink({
          url: props.url,
          transformer: superjson,
          headers() {
            const heads = new Map(props.headers);
            return Object.fromEntries(heads);
          },
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            });
          },

          // fetch: props.fetch && (url, options) =>  {
          //     return props.fetch(url, {
          //       ...options,
          //       credentials: "include",
          //     });
          // },
        }),
      ],
    }),
  );
  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </api.Provider>
  );
}
