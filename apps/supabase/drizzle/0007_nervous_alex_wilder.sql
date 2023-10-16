ALTER TABLE "workflow_execution" ADD COLUMN "entry_node_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_execution" ADD COLUMN "exit_node_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_execution" ADD CONSTRAINT "workflow_execution_entry_node_id_workflow_node_id_fk" FOREIGN KEY ("entry_node_id") REFERENCES "workflow_node"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_execution" ADD CONSTRAINT "workflow_execution_exit_node_id_workflow_node_id_fk" FOREIGN KEY ("exit_node_id") REFERENCES "workflow_node"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
