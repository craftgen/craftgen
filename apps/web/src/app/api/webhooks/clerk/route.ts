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

const appendToPlatformDb = (userJSON: UserJSON) =>
  Effect.gen(function* (_) {
    const { pDb } = yield* _(PlatformDb);
    const user = yield* _(
      Effect.tryPromise(() =>
        pDb
          .insert(platform.user)
          .values({
            id: userJSON.id as `user-${string}`,
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

const createTenantDb = (user: typeof platform.user.$inferSelect) =>
  Effect.gen(function* (_) {
    const { pDb } = yield* _(PlatformDb);
    const dbName = orgDatabaseName(user.id);
    const db = yield* _(createOrganizationDatabase({ orgId: dbName }));

    const personalOrg = yield* _(
      Effect.tryPromise(() =>
        pDb
          .insert(platform.organization)
          .values({
            id: user.id,
            name: user.username!,
            slug: user.username!,
            personal: true,
            database_name: dbName,
            database_auth_token: db.authToken,
          })
          .returning(),
      ),
    );

    return {
      personalOrg,
      db,
    };
  });

const handleWebhookEvent = (evt: WebhookEvent) =>
  Match.type<WebhookEvent>()
    .pipe(
      Match.when({ type: "user.created" }, ({ data }) =>
        pipe(
          Effect.zipRight(appendToPlatformDb),
          Effect.zipRight(createTenantDb),
          Effect.tap((user) =>
            Effect.log(`User created: ${JSON.stringify(user)}`),
          ),
        ),
      ),
      Match.when({ type: "organization.created" }, ({ data }) =>
        Effect.log(`Organization created: ${JSON.stringify(data)}`),
      ),
      Match.orElse(({ type }) => Effect.log(`Unhandled event type: ${type}`)),
    )(evt)
    .pipe(
      Effect.provide(PlatformDb.Live()),
      Effect.provide(TursoClient.Live()),
    );

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
