/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { auth } from "@googleapis/webmasters";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { initTRPC, TRPCError } from "@trpc/server";
import { OpenAI } from "openai";
import Replicate from "replicate";
import superjson from "superjson";
import { ZodError } from "zod";

import { and, db, eq, schema } from "@craftgen/db/db";

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
  session: Session | null;
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
    session: opts.session,
    db,
  };
};

/**
 * This is the actual context you'll use in your router. It will be used to
 * process every request that goes through your tRPC endpoint
 * @link https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: {
  headers: Headers;
  auth: Session | null;
  supabaseService?: SupabaseClient;
}) => {
  const session = opts.auth;

  const source = opts.headers.get("x-trpc-source") ?? "unknown";
  console.log(">>> tRPC Request from", source, "by", `${session?.user.email} `);

  return createInnerTRPCContext({
    session,
  });
};

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
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

const getActiveProject = async (session: Session) => {
  const currentProjectSlug = session?.user.user_metadata.currentProjectSlug;

  const [projectS] = await db
    .select()
    .from(schema.project)
    .leftJoin(
      schema.projectMembers,
      and(
        eq(schema.projectMembers.userId, session?.user.id!),
        eq(schema.projectMembers.projectId, schema.project.id),
      ),
    )
    .where(
      and(
        eq(schema.project.slug, currentProjectSlug),
        eq(schema.project.id, schema.projectMembers.projectId),
      ),
    )
    .limit(1);

  if (!projectS) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this project",
    });
  }
  return projectS;
};

const openaiMiddleware = t.middleware(async ({ ctx, next }) => {
  const projectS = await getActiveProject(ctx.session!);

  const [openaiApiKey] = await ctx.db
    .select()
    .from(schema.variable)
    .where(
      and(
        eq(schema.variable.project_id, projectS.project.id),
        eq(schema.variable.key, "OPENAI_API_KEY"),
      ),
    )
    .limit(1);

  if (!openaiApiKey || !openaiApiKey.value) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "OpenAI API Key not found",
    });
  }

  return next({
    ctx: {
      openai: new OpenAI({
        apiKey: openaiApiKey.value as string,
      }),
    },
  });
});

export const openAiProducer = protectedProcedure.use(openaiMiddleware);

const googleAuthMiddleware = t.middleware(async ({ ctx, next }) => {
  const googleAuth = new auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  });
  console.log("ctx.session?.user?.id", ctx);
  const authUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, ctx.session?.user?.id!),
  });
  if (!authUser)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });

  googleAuth.setCredentials({
    access_token: authUser?.google_access_token,
    refresh_token: authUser?.google_refresh_token,
  });

  return next({
    ctx: {
      googleAuth,
    },
  });
});

export const googleAuthProducer = protectedProcedure.use(googleAuthMiddleware);

const replicateMiddleware = t.middleware(async ({ ctx, next }) => {
  const projectS = await getActiveProject(ctx.session!);

  const [replicateApiKey] = await ctx.db
    .select()
    .from(schema.variable)
    .where(
      and(
        eq(schema.variable.project_id, projectS.project.id),
        eq(schema.variable.provider, "REPLICATE"),
      ),
    )
    .limit(1);

  if (!replicateApiKey || !replicateApiKey.value) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "REPLICATE_API_KEY API Key not found",
    });
  }

  const replicate = new Replicate({
    auth: replicateApiKey.value,
  });

  return next({
    ctx: {
      replicate,
    },
  });
});
export const replicateProducer = protectedProcedure.use(replicateMiddleware);
