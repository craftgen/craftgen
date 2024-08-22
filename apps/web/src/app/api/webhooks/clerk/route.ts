import { headers } from "next/headers";
import { UserJSON, WebhookEvent } from "@clerk/nextjs/server";
import { Config, Data, Effect, Match, pipe, Redacted } from "effect";
import { Webhook, WebhookRequiredHeaders } from "svix";

import {
  createOrganizationDatabase,
  Databases,
  eq,
  getTenantDbClient,
  orgDatabaseName,
  platform,
  PlatformDb,
  tenant,
  TursoClient,
} from "@craftgen/database";

const verifyWebhook = (body: string, headers: WebhookRequiredHeaders) =>
  Effect.gen(function* (_) {
    const secret = yield* _(Config.redacted("CLERK_WEBHOOK_SECRET"));
    return yield* Effect.try(() => {
      const wh = new Webhook(Redacted.value(secret));
      return wh.verify(body, headers) as WebhookEvent;
    });
  });

class UserCreateFailedError extends Data.TaggedError("UserCreateFailedError")<{
  readonly message: string;
}> {}

const createUserInPlatformDB = (userJSON: UserJSON) =>
  Effect.gen(function* (_) {
    const { pDb } = yield* _(PlatformDb);
    const user = yield* _(
      Effect.tryPromise(() =>
        pDb
          .insert(platform.user)
          .values({
            id: userJSON.id as `user_${string}`,
            avatarUrl: userJSON.image_url,
            username: userJSON.username!,
            email: userJSON.email_addresses?.[0]?.email_address || "",
            fullName: userJSON.first_name + " " + userJSON.last_name,
            firstName: userJSON.first_name,
            lastName: userJSON.last_name,
          })
          .returning(),
      ),
      Effect.flatMap((users) =>
        users[0]
          ? Effect.succeed(users[0])
          : Effect.fail(
              new UserCreateFailedError({ message: "User not created" }),
            ),
      ),
    );
    return user;
  });

const createOrgInPlatformDB = (
  platformData: typeof platform.organization.$inferInsert,
) =>
  Effect.gen(function* (_) {
    const { pDb } = yield* PlatformDb;
    const org = yield* _(
      Effect.tryPromise(() =>
        pDb.insert(platform.organization).values(platformData).returning(),
      ),
      Effect.flatMap((orgs) =>
        orgs[0]
          ? Effect.succeed(orgs[0])
          : Effect.fail(new Error("Organization not created")),
      ),
    );
    return org;
  });

const createTenantDb = (org: typeof platform.organization.$inferSelect) =>
  Effect.gen(function* (_) {
    const db = yield* _(
      createOrganizationDatabase({ orgId: org.database_name }),
    );
    const { pDb } = yield* PlatformDb;
    yield* _(
      Effect.tryPromise(() =>
        pDb
          .update(platform.organization)
          .set({
            database_auth_token: db.authToken,
            database_name: db.orgDatabase.name as `org-${string}`,
          })
          .where(eq(platform.organization.id, org.id)),
      ),
      Effect.tap((res) =>
        Effect.log(`Updated org ${org.id} with db ${db.orgDatabase.name}`),
      ),
    );
    return db;
  }).pipe(Effect.provide(TursoClient.Live()));

const handleWebhookEvent = (evt: WebhookEvent) =>
  Match.type<WebhookEvent>()
    .pipe(
      Match.when(
        { type: "user.created" },
        ({ data }) =>
          Effect.gen(function* (_) {
            Effect.log(`User created: ${JSON.stringify(data)}`);
            const userInPlatform = yield* createUserInPlatformDB(data);
            const personalOrg = yield* createOrgInPlatformDB({
              id: userInPlatform.id,
              name: userInPlatform.username!,
              slug: userInPlatform.username!,
              personal: true,
            });
            const userDb = yield* createTenantDb(personalOrg);
          }),
        // pipe(
        //   Effect.zipRight(appendToPlatformDb),
        //   Effect.zipRight(createTenantDb),
        //   Effect.tap((user) =>
        //     Effect.log(`User created: ${JSON.stringify(user)}`),
        //   ),
        // ),
      ),
      Match.when({ type: "organization.created" }, ({ data }) =>
        Effect.gen(function* (_) {
          Effect.log(`Organization created: ${JSON.stringify(data)}`);
          // const org = yield* _(createOrgInPlatformDB(data));
        }),
      ),
      Match.orElse(({ type }) => Effect.log(`Unhandled event type: ${type}`)),
    )(evt)
    .pipe(Effect.provide(PlatformDb.Live()));

export async function POST(req: Request) {
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", { status: 400 });
  }

  const body = await req.text();

  const program = pipe(
    verifyWebhook(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }),
    Effect.flatMap(handleWebhookEvent),
    Effect.match({
      onSuccess: () =>
        new Response("Webhook processed successfully", { status: 200 }),
      onFailure: (error) => {
        console.error("Error processing webhook:", error);
        return new Response("Error processing webhook", { status: 500 });
      },
    }),
  );

  return Effect.runPromise(program);
}
