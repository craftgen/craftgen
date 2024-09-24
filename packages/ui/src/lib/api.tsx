import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loggerLink, unstable_httpBatchStreamLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@craftgen/ipc-api";

// export const api = createTRPCReact<AppRouter>();

// export function TRPCReactProvider(props: {
//   children: React.ReactNode;
//   headers: Headers;
//   url: string;
//   fetch?: (url: string, options?: RequestInit) => Promise<Response>;
//   api: R
//   queryClient: QueryClient;
//   trpcClient: ReturnType<typeof api.createClient>
// }) {
//   return (
//     <props.api.Provider client={props.trpcClient} queryClient={props.queryClient}>
//       <QueryClientProvider client={props.queryClient}>
//         {props.children}
//       </QueryClientProvider>
//     </props.api.Provider>
//   );
// }
