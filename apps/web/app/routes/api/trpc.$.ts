import { getAuth } from "@clerk/tanstack-start/server";
import {
  createAPIFileRoute,
  StartAPIMethodCallback,
} from "@tanstack/start/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@craftgen/ipc-api";

const handler: StartAPIMethodCallback<"/api/trpc/$"> = async ({
  request,
  params,
}) => {
  const auth = await getAuth(request);
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req: request,
    createContext: () =>
      createTRPCContext({
        auth: auth,
        headers: request.headers,
      }),
  });
  return response;
};

export const Route = createAPIFileRoute("/api/trpc/$")({
  GET: handler,
  POST: handler,
});
