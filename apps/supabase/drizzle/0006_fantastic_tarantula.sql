ALTER TABLE "node_data" DROP CONSTRAINT "node_data_playground_id_playground_id_fk";
--> statement-breakpoint
ALTER TABLE "node_data" ADD COLUMN "project_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_data" ADD CONSTRAINT "node_data_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "node_data" DROP COLUMN IF EXISTS "playground_id";