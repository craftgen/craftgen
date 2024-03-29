import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@seocraft/api";
import type { Database } from "@seocraft/supabase/db/database.types";

import { getServiceSupabase } from "@/utils/supabase";

// export const runtime = "edge";

/**
 * Configure basic CORS headers
 * You should extend this to match your needs
 */
function setCorsHeaders(res: Response) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Request-Method", "*");
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set("Access-Control-Allow-Headers", "*");
}

export function OPTIONS() {
  const response = new Response(null, {
    status: 204,
  });
  setCorsHeaders(response);
  return response;
}

const handler = async (req: Request) => {
  // console.log(">>> tRPC Request from", req);
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
  // const supabase = createMiddlewareClient<Database>({ cookies });
  const session = await supabase.auth.getSession();
  // console.log("AUTH", req.headers.get("Cookie"));
  console.time("GETTIN USER TOOK:");
  const user = await supabase.auth.getUser();
  console.timeEnd("GETTIN USER TOOK:");
  const supabaseService = getServiceSupabase();

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () =>
      createTRPCContext({
        auth: session.data.session
          ? {
              ...session.data.session,
              user: {
                ...session.data.session.user,
                user_metadata: {
                  ...session.data.session.user.user_metadata,
                  ...user?.data?.user?.user_metadata,
                },
              },
            }
          : null,
        req,
        supabaseService: supabaseService,
      }),
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });

  setCorsHeaders(response);
  return response;
};

export { handler as GET, handler as POST };
