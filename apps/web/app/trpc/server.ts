import { QueryClient } from "@tanstack/react-query";
import { createTRPCQueryUtils } from "@trpc/react-query";

import { AppRouter, createCaller, createTRPCContext } from "@craftgen/ipc-api";

export const trpcCaller = async ({
  auth,
  queryClient,
}: {
  auth: any;
  queryClient: QueryClient;
}) => {
  const context = await createTRPCContext({
    headers: new Headers(),
    auth,
  });
  // const client = createCaller(context);

  const trpcQueryUtils = createTRPCQueryUtils<AppRouter>({
    queryClient,
    client: client as any,
  });
  return trpcQueryUtils;
};
