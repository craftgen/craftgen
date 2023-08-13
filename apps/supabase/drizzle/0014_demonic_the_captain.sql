ALTER TABLE "article" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "article" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "slug" UNIQUE("project_id","slug");