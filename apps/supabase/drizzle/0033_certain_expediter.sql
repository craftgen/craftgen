ALTER TABLE "project_api_key" ALTER COLUMN "key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project_variable" ALTER COLUMN "value" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "project_variable" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "project_api_key" DROP COLUMN IF EXISTS "is_system";