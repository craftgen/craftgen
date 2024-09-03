/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { createClerkClient, type AuthObject } from "@clerk/backend";
import { type createClient } from "@libsql/client";

import { tenantDbClient } from "../database/lib/client-org.ts";
import {
  createPlatformDbClient,
  type PlatformDbClient,
  type TenantDbClient,
} from "../database/mod.ts";
import { EventProcessor } from "../database/tenant/queue.ts";
import { Effect, initTRPC, superjson, TRPCError, ZodError } from "./deps.ts";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API
 *
 * These allow you to access things like the database, the session, etc, when
 * processing a request
 *
 */
interface CreateContextOptions {
  auth: AuthObject | null;
  tenantDb?: TenantDbClient;
  platformDb?: PlatformDbClient;
  client?: ReturnType<typeof createClient>;
  queue?: EventProcessor;
}

/**
 * This helper generates the "internals" for a tRPC context. If you need to use
 * it, you can export it from here
 *
 * Examples of things you may need it for:
 * - testing, so we dont have to mock Next.js' req/res
 * - trpc's `createSSGHelpers` where we don't have req/res
 * @see https://create.t3.gg/en/usage/trpc#-servertrpccontextts
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    queue: opts.queue,
    auth: opts.auth,
    tDb: opts.tenantDb,
    pDb: opts.platformDb,
    client: opts.client,
  };
};

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * This is the actual context you'll use in your router. It will be used to
 * process every request that goes through your tRPC endpoint
 * @link https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: {
  headers: Headers;
  auth: AuthObject | null;
  client?: ReturnType<typeof createClient>;
  queue?: EventProcessor;
}) => {
  const auth = opts.auth;

  const source = opts.headers.get("x-trpc-source") ?? "unknown";
  console.log(">>> tRPC Request from", source, "by", `${auth?.userId} `);

  const platformDb = Effect.runSync(createPlatformDbClient);

  console.log("AUTH IN BACKEND", auth);

  const user = await clerkClient.users.getUser(auth?.userId);

  console.log({ user });

  // const tenantDb = Effect.runSync(
  //   getTenantDbClient({
  //     tenantId: user.privateMetadata.database_name,
  //     authToken: user.privateMetadata.database_auth_token,
  //   }),
  // );

  const tenantDb = () => {
    if (
      !user?.privateMetadata.database_name &&
      !user?.privateMetadata.database_auth_token
    ) {
      return undefined;
    }
    return tenantDbClient({
      url: `libsql://${user.privateMetadata.database_name}-craftgen.turso.io`,
      authToken: user.privateMetadata.database_auth_token as string,
    });
  };

  return createInnerTRPCContext({
    queue: opts.queue,
    auth,
    client: opts.client,
    tenantDb: tenantDb(),
    platformDb,
  });
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure;

/**
 * Reusable middleware that enforces users are logged in before running the
 * procedure
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Protected (authed) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use
 * this. It verifies the session is valid and guarantees ctx.session.user is not
 * null
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
