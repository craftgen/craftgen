import { getAuth } from "@clerk/tanstack-start/server";
import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@craftgen/ipc-api";

const handler = async (req: Request) => {
  const auth = getAuth(req);

  // const response = await fetchRequestHandler({
  //   endpoint: "/api/trpc",
  //   router: appRouter,
  //   req: req as unknown as Request,
  //   createContext: () =>
  //     createTRPCContext({
  //       // headers: req.headers,
  //       auth: auth,
  //       headers: req.headers,

  //       // ? {
  //       //     ...session.data.session,
  //       //     user: {
  //       //       ...session.data.session.user,
  //       //       user_metadata: {
  //       //         ...session.data.session.user.user_metadata,
  //       //         ...user?.data?.user?.user_metadata,
  //       //       },
  //       //     },
  //       //   }
  //       // : null,
  //       // supabaseService: supabaseService,
  //     }),
  //   onError({ error, path }) {
  //     console.error(`>>> tRPC Error on '${path}'`, error);
  //   },
  // });
  return json({
    req,
    auth,
  });
};

export const Route = createAPIFileRoute("/api/trpc/$trpc")({
  GET: handler,
  POST: handler,
});
