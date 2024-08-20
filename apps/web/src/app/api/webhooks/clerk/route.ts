import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Effect, Layer, Match } from "effect";
import { Webhook } from "svix";

import {
  platform,
  PlatformDb,
  PlatformDbLive,
  tenant,
  TenantDb,
  tenantDbClient,
  TenantDbClient,
  TenantDBConfig,
} from "@craftgen/database";

export async function POST(req: Request) {
  console.log("CLERK WEBHOOK", req);
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
    );
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (!id) {
    return new Response("No ID found", {
      status: 400,
    });
  }

  const handleUserCreated = Effect.gen(function* (_) {
    const { pDb } = yield* PlatformDb;
    const user = yield* _(
      Effect.tryPromise(() =>
        pDb
          .insert(platform.user)
          .values({
            id: id,
            fullName: payload.data.object.fullName,
            avatarUrl: payload.data.object.imageUrl,
            username: payload.data.object.username,
            email: payload.data.object.emailAddresses[0].emailAddress,
            firstName: payload.data.object.firstName,
            lastName: payload.data.object.lastName,
          })
          .returning(),
      ),
    );

    const tenantDbConfigLayer = Layer.succeed(
      TenantDBConfig,
      TenantDBConfig.of({
        getConfig: Effect.succeed({
          url: "your-tenant-db-url",
          authToken: "your-tenant-db-auth-token",
        }),
      }),
    );

    const tenantDbLayer = Layer.effect(TenantDb, TenantDb.live()).pipe(
      Layer.provide(tenantDbConfigLayer),
    );

    const userInTenant = yield* _(
      Effect.gen(function* (_) {
        const { tDb } = yield* _(TenantDb);
        return yield* _(
          Effect.tryPromise(() =>
            tDb
              .insert(tenant.user)
              .values({
                id: id,
                fullName: payload.data.object.fullName,
                avatarUrl: payload.data.object.imageUrl,
                username: payload.data.object.username,
                email: payload.data.object.emailAddresses[0].emailAddress,
                firstName: payload.data.object.firstName,
                lastName: payload.data.object.lastName,
              })
              .returning(),
          ),
        );
      }).pipe(Effect.provide(tenantDbLayer)),
    );

    return { user, userInTenant };
  });

  const match = Match.type<WebhookEvent>().pipe(
    Match.when({ type: "user.created" }, ({ data }) => {
      const { id } = data;
      return Effect.gen(function* (_) {
        const result = yield* _(handleUserCreated);
        console.log("User created", result.user);
        console.log("User created in tenant", result.userInTenant);
      }).pipe(Effect.provide(PlatformDbLive));
    }),
    Match.when({ type: "organization.created" }, ({ data }) => {
      const { id } = data;
    }),
    Match.orElse(({ type }) => {
      console.error("Unhandled event type:", type);
      return;
    }),
  );

  match(evt);

  // // const databaseName = md5(id);

  // try {
  //   await turso.databases.create(databaseName, {
  //     schema: process.env.TURSO_SCHEMA_DATABASE_NAME!,
  //   });
  // } catch (err) {
  //   console.error("Error processing webhook:", err);
  //   return new Response("Error occured", {
  //     status: 500,
  //   });
  // }

  return new Response();
}
