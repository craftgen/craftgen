ALTER TABLE "node_execution_data" ALTER COLUMN "state" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_node" ADD COLUMN "project_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_version" ADD COLUMN "project_id" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_node" ADD CONSTRAINT "workflow_node_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_version" ADD CONSTRAINT "workflow_version_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
