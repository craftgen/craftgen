ALTER TABLE "playground" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "playground" ADD CONSTRAINT "playground_project_id_slug_unique" UNIQUE("project_id","slug");