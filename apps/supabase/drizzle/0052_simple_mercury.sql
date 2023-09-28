CREATE TABLE IF NOT EXISTS "playground_version" (
	"id" text PRIMARY KEY NOT NULL,
	"playground_id" uuid NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp,
	"change_log" text DEFAULT 'initial version',
	CONSTRAINT "playground_version_playground_id_version_unique" UNIQUE("playground_id","version")
);
--> statement-breakpoint
ALTER TABLE "playground" DROP CONSTRAINT "playground_project_id_slug_version_unique";--> statement-breakpoint
ALTER TABLE "playground" ADD COLUMN "project_slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "playground_node" ADD COLUMN "playground_version_id" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playground" ADD CONSTRAINT "playground_project_slug_project_slug_fk" FOREIGN KEY ("project_slug") REFERENCES "project"("slug") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playground_node" ADD CONSTRAINT "playground_node_playground_version_id_playground_version_id_fk" FOREIGN KEY ("playground_version_id") REFERENCES "playground_version"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "playground" DROP COLUMN IF EXISTS "version";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playground_version" ADD CONSTRAINT "playground_version_playground_id_playground_id_fk" FOREIGN KEY ("playground_id") REFERENCES "playground"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "playground" ADD CONSTRAINT "playground_project_id_slug_unique" UNIQUE("project_id","slug");