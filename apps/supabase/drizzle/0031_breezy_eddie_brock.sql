ALTER TABLE "project" ALTER COLUMN "site" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "project_api_key" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;