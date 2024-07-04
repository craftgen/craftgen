ALTER TABLE "project_variable" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "project_variable" ADD COLUMN "provider" text;--> statement-breakpoint
ALTER TABLE "project_variable" ADD COLUMN "default" boolean DEFAULT false NOT NULL;