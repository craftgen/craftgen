ALTER TABLE "node_execution_data" ADD COLUMN "workflow_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "node_execution_data" ADD COLUMN "workflow_version_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "node_execution_data" ADD COLUMN "project_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "node_execution_data" ADD COLUMN "workflow_node_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "node_execution_data" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_execution_data" ADD CONSTRAINT "node_execution_data_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "workflow"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_execution_data" ADD CONSTRAINT "node_execution_data_workflow_version_id_workflow_version_id_fk" FOREIGN KEY ("workflow_version_id") REFERENCES "workflow_version"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_execution_data" ADD CONSTRAINT "node_execution_data_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_execution_data" ADD CONSTRAINT "node_execution_data_workflow_node_id_workflow_node_id_fk" FOREIGN KEY ("workflow_node_id") REFERENCES "workflow_node"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
