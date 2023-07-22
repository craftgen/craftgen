CREATE TABLE IF NOT EXISTS "playground" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"edges" json NOT NULL,
	"nodes" json NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playground" ADD CONSTRAINT "playground_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
