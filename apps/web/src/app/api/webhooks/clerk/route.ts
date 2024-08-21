import { headers } from "next/headers";
import { UserJSON, WebhookEvent } from "@clerk/nextjs/server";
import { Config, Data, Effect, Layer, Match, pipe, Redacted } from "effect";
import { Webhook, WebhookRequiredHeaders } from "svix";

import {
  Databases,
  getTenantDbClient,
  platform,
  PlatformDb,
  tenant,
} from "@craftgen/database";

const verifyWebhook = (body: string, headers: WebhookRequiredHeaders) =>
  Effect.gen(function* (_) {
    const secret = yield* _(Config.redacted("CLERK_WEBHOOK_SECRET"));
    return yield* Effect.try(() => {
      const wh = new Webhook(Redacted.value(secret));
      return wh.verify(body, headers) as WebhookEvent;
    });
  });

const appendToPlatformDb = (userJSON: UserJSON) =>
  Effect.gen(function* (_) {
    const { pDb } = yield* _(PlatformDb);
    const user = yield* _(
      Effect.tryPromise(() =>
        pDb
          .insert(platform.user)
          .values({
            id: userJSON.id,
            avatarUrl: userJSON.image_url,
            username: userJSON.username!,
            email: userJSON.email_addresses?.[0]?.email_address || "",
            fullName: userJSON.first_name + " " + userJSON.last_name,
            firstName: userJSON.first_name,
            lastName: userJSON.last_name,
          })
          .returning(),
      ),
    );
    return user;
  });

const handleWebhookEvent = (evt: WebhookEvent) =>
  Match.type<WebhookEvent>()
    .pipe(
      Match.when({ type: "user.created" }, ({ data }) =>
        pipe(
          appendToPlatformDb(data),
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
