import { headers } from "next/headers";
import {
  createClerkClient,
  UserJSON,
  WebhookEvent,
} from "@clerk/nextjs/server";
import { Config, Data, Effect, Match, pipe, Redacted } from "effect";
import { Webhook, WebhookRequiredHeaders } from "svix";

import {
  createOrganizationDatabase,
  eq,
  getTenantDbClient,
  platform,
  PlatformDb,
  tenant,
  TursoClient,
} from "@craftgen/database";
import { createIdWithPrefix } from "@craftgen/database/lib/id";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const verifyWebhook = (body: string, headers: WebhookRequiredHeaders) =>
  Effect.gen(function* (_) {
    // const secret = yield* _(Config.redacted("CLERK_WEBHOOK_SECRET"));
    const secret = "whsec_/jnS1wEFVWIXbhK2XDkC1782s+WCSgpf";
    return yield* Effect.try(() => {
      // const wh = new Webhook(Redacted.value(secret));
      const wh = new Webhook(secret);
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
          .onConflictDoUpdate({
            target: platform.user.id,
            set: {
              avatarUrl: userJSON.image_url,
              username: userJSON.username!,
              email: userJSON.email_addresses?.[0]?.email_address || "",
              fullName: userJSON.first_name + " " + userJSON.last_name,
              firstName: userJSON.first_name,
              lastName: userJSON.last_name,
            },
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
        pDb
          .insert(platform.organization)
          .values(platformData)
          .onConflictDoUpdate({
            target: platform.organization.id,
            set: platformData,
          })
          .returning(),
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
    if (org.database_name && org.database_auth_token) {
      Effect.log(
        `Organization ${org.id} already has a database ${org.database_name}`,
      );
      return org;
    }
    const db = yield* _(
      createOrganizationDatabase({ orgId: org.database_name }),
    );
    Effect.log(`Created database ${db.orgDatabase.name} for org ${org.id} `, {
      dbAuth: db.authToken,
      dbName: db.orgDatabase.name,
    });
    const { pDb } = yield* PlatformDb;
    const updatedOrg = yield* _(
      Effect.tryPromise(() =>
        pDb
          .update(platform.organization)
          .set({
            database_auth_token: db.authToken,
            database_name: db.orgDatabase.name as `org-${string}`,
          })
          .where(eq(platform.organization.id, org.id))
          .returning(),
      ),
      Effect.flatMap((orgs) =>
        orgs[0]
          ? Effect.succeed(orgs[0])
          : Effect.fail(
              new Error(
                "Updating organization is failed after creating a tenant db.",
              ),
            ),
      ),
      Effect.tap((res) =>
        Effect.log(`Updated org ${org.id} with db ${db.orgDatabase.name}`),
      ),
    );
    return updatedOrg;
  }).pipe(Effect.provide(TursoClient.Live()));

const handleWebhookEvent = (evt: WebhookEvent) =>
  Match.type<WebhookEvent>()
    .pipe(
      Match.when({ type: "user.created" }, ({ data }) =>
        Effect.gen(function* (_) {
          Effect.log(`User created: ${JSON.stringify(data)}`);
          const userInPlatform = yield* createUserInPlatformDB(data);
          const personalOrg = yield* createOrgInPlatformDB({
            id: userInPlatform.id,
            name: userInPlatform.username!,
            slug: userInPlatform.username!,
            logo: userInPlatform.avatarUrl,
            personal: true,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            database_name: createIdWithPrefix(
              "user",
              "-",
            )() as `user-${string}`,
          });

          const { pDb } = yield* PlatformDb;
          yield* _(
            Effect.tryPromise(() =>
              pDb
                .update(platform.user)
                .set({
                  personalOrgId: personalOrg.id as `org_${string}`,
                })
                .where(
                  eq(platform.user.id, userInPlatform.id as `user_${string}`),
                ),
            ),
          );
          yield* _(
            Effect.tryPromise(() =>
              pDb
                .insert(platform.organizationMembers)
                .values({
                  id: data.id as `orgmem_${string}`,
                  organizationId: personalOrg.id as `org_${string}`,
                  userId: userInPlatform.id as `user_${string}`,
                  role: "org:admin",
                  createdAt: data.created_at,
                  updatedAt: data.updated_at,
                })
                .onConflictDoUpdate({
                  target: platform.organizationMembers.id,
                  set: {
                    organizationId: personalOrg.id as `org_${string}`,
                    userId: userInPlatform.id as `user_${string}`,
                    role: "org:admin",
                    createdAt: data.created_at,
                    updatedAt: data.updated_at,
                  },
                }),
            ),
          );
          const orgWithDbInformation = yield* createTenantDb(personalOrg);
          yield* _(
            Effect.tryPromise(() =>
              clerkClient.users.updateUserMetadata(data.id, {
                privateMetadata: {
                  database_name: orgWithDbInformation?.database_name,
                  database_auth_token:
                    orgWithDbInformation?.database_auth_token!,
                },
              }),
            ),
            Effect.tap((clerkUser) => {
              Effect.log("Clerk user updated", clerkUser);
            }),
          );

          const tDb = yield* _(
            getTenantDbClient({
              url: `libsql://${orgWithDbInformation?.database_name}-craftgen.turso.io`,
              authToken: orgWithDbInformation?.database_auth_token!,
            }),
          );

          // clone org and user to tenant
          yield* _(
            Effect.tryPromise(() =>
              tDb
                .insert(tenant.user)
                .values({
                  id: userInPlatform.id as `user_${string}`,
                  username: data.username!,
                  avatarUrl: data.image_url,
                  createdAt: data.created_at,
                  updatedAt: data.updated_at,
                })
                .onConflictDoUpdate({
                  target: tenant.user.id,
                  set: {
                    username: data.username!,
                    avatarUrl: data.image_url,
                    updatedAt: data.updated_at,
                  },
                }),
            ),
          );

          yield* _(
            Effect.tryPromise(() =>
              tDb
                .insert(tenant.organization)
                .values({
                  id: personalOrg.id as `org_${string}`,
                  name: personalOrg.name,
                  slug: personalOrg.slug,
                  personal: true,
                  createdAt: data.created_at,
                  updatedAt: data.updated_at,
                })
                .onConflictDoUpdate({
                  target: tenant.organization.id,
                  set: {
                    name: personalOrg.name,
                    slug: personalOrg.slug,
                    updatedAt: data.updated_at,
                  },
                }),
            ),
          );

          yield* _(
            Effect.tryPromise(() =>
              tDb
                .insert(tenant.organizationMembers)
                .values({
                  id: data.id as `orgmem_${string}`,
                  organizationId: personalOrg.id as `org_${string}`,
                  userId: userInPlatform.id as `user_${string}`,
                  role: "org:admin",
                  createdAt: data.created_at,
                  updatedAt: data.updated_at,
                })
                .onConflictDoUpdate({
                  target: tenant.organizationMembers.id,
                  set: {
                    role: "org:admin",
                    updatedAt: data.updated_at,
                  },
                }),
            ),
          );
        }),
      ),
      Match.when({ type: "user.updated" }, ({ data }) =>
        Effect.gen(function* (_) {
          Effect.log(`User updated: ${JSON.stringify(data)}`);
          const { pDb } = yield* PlatformDb;
          yield* _(
            Effect.tryPromise(() =>
              pDb
                .update(platform.user)
                .set({
                  username: data.username!,
                  avatarUrl: data.image_url,
                  updatedAt: data.updated_at,
                })
                .where(eq(platform.user.id, data.id as `user_${string}`)),
            ),
          );
        }),
      ),
      Match.when({ type: "user.deleted" }, ({ data }) =>
        Effect.gen(function* (_) {
          Effect.log(`User deleted: ${JSON.stringify(data)}`);
          const { pDb } = yield* PlatformDb;

          const user = yield* _(
            Effect.tryPromise(() =>
              pDb.query.user.findFirst({
                where: eq(platform.user.id, data.id as `user_${string}`),
                with: {
                  personalOrg: true,
                },
              }),
            ),
            Effect.flatMap((user) =>
              user
                ? Effect.succeed(user)
                : Effect.fail(new Error("User not found")),
            ),
            Effect.flatMap((user) =>
              user.personalOrg
                ? Effect.succeed(user)
                : Effect.fail(new Error("User has no personal org")),
            ),
          );
          const turso = yield* _(TursoClient).pipe(
            Effect.provide(TursoClient.Live()),
          );
          yield* _(
            Effect.tryPromise(() =>
              turso.databases.delete(
                user.personalOrg?.database_name as `org-${string}`,
              ),
            ),
          );
          yield* _(
            Effect.tryPromise(() =>
              pDb
                .delete(platform.user)
                .where(eq(platform.user.id, user.id as `user_${string}`)),
            ),
          );
        }),
      ),
      Match.when({ type: "organization.created" }, ({ data }) =>
        Effect.gen(function* (_) {
          Effect.log(`Organization created: ${JSON.stringify(data)}`);
          const org = yield* _(
            createOrgInPlatformDB({
              id: data.id,
              name: data.name,
              slug: data.slug,
              logo: data.image_url,
              personal: false,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            }),
          );
          const orgWithDbInformation = yield* createTenantDb(org);

          yield* _(
            Effect.tryPromise(() =>
              clerkClient.organizations.updateOrganization(
                orgWithDbInformation?.id,
                {
                  privateMetadata: {
                    database_name: orgWithDbInformation?.database_name,
                    database_auth_token:
                      orgWithDbInformation?.database_auth_token,
                  },
                },
              ),
            ),
          );
        }),
      ),
      Match.when({ type: "organization.updated" }, ({ data }) =>
        Effect.gen(function* (_) {
          Effect.log(`Organization updated: ${JSON.stringify(data)}`);
          const { pDb } = yield* PlatformDb;
          const org = yield* _(
            Effect.tryPromise(() =>
              pDb.update(platform.organization).set({
                name: data.name,
                slug: data.slug,
                logo: data.image_url,
                updatedAt: data.updated_at,
              }),
            ),
          );
        }),
      ),
      Match.when({ type: "organization.deleted" }, ({ data }) =>
        Effect.gen(function* (_) {
          Effect.log(`Organization deleted: ${JSON.stringify(data)}`);
          const { pDb } = yield* PlatformDb;
          yield* _(
            Effect.tryPromise(() =>
              pDb
                .delete(platform.organization)
                .where(
                  eq(platform.organization.id, data.id as `org_${string}`),
                ),
            ),
          );
        }),
      ),
      Match.when({ type: "organizationMembership.created" }, ({ data }) =>
        Effect.gen(function* (_) {
          Effect.log(
            `Organization membership created: ${JSON.stringify(data)}`,
          );
          const { pDb } = yield* PlatformDb;
          const org = yield* _(
            Effect.tryPromise(() =>
              pDb.insert(platform.organizationMembers).values({
                id: data.id as `orgmem_${string}`,
                organizationId: data.organization.id as `org_${string}`,
                userId: data.public_user_data.user_id as `user_${string}`,
                role: data.role,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
              }),
            ),
          );
        }),
      ),
      Match.when({ type: "organizationMembership.updated" }, ({ data }) =>
        Effect.gen(function* (_) {
          Effect.log(
            `Organization membership updated: ${JSON.stringify(data)}`,
          );
          const { pDb } = yield* PlatformDb;
          const org = yield* _(
            Effect.tryPromise(() =>
              pDb.update(platform.organizationMembers).set({
                role: data.role,
                updatedAt: data.updated_at,
              }),
            ),
          );
        }),
      ),
      Match.when({ type: "organizationMembership.deleted" }, ({ data }) =>
        Effect.gen(function* (_) {
          Effect.log(
            `Organization membership deleted: ${JSON.stringify(data)}`,
          );
          const { pDb } = yield* PlatformDb;
          yield* _(
            Effect.tryPromise(() =>
              pDb
                .delete(platform.organizationMembers)
                .where(
                  eq(
                    platform.organizationMembers.id,
                    data.id as `orgmem_${string}`,
                  ),
                ),
            ),
          );
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
    Effect.tap((event) =>
      Effect.log(`Webhook event: ${JSON.stringify(event.type)}`),
    ),
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
