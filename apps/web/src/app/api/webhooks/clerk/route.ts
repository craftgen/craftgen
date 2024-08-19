import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@tursodatabase/api";
import { Webhook } from "svix";

const turso = createClient({
  token: process.env.TURSO_USER_API_TOKEN!,
  org: process.env.TURSO_ORG_NAME!,
});

const allowedEvents = ["user.created"];

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

  if (!allowedEvents.includes(eventType)) {
    return new Response("Event not allowed", {
      status: 400,
    });
  }

  // const databaseName = md5(id);

  try {
    await turso.databases.create(databaseName, {
      schema: process.env.TURSO_SCHEMA_DATABASE_NAME!,
    });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response("Error occured", {
      status: 500,
    });
  }

  return new Response();
}
