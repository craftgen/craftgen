ALTER TABLE "user" ADD COLUMN "google_scopes" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "google_scopes" SET NOT NULL;
