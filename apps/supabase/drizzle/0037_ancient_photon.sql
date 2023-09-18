CREATE TABLE IF NOT EXISTS "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"platforms" text[] DEFAULT '{}' 
);--> statement-breakpoint
ALTER TABLE "waitlist" ALTER COLUMN "platforms" SET NOT NULL;