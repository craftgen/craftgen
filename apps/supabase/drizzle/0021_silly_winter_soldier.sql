ALTER TABLE "workflow_execution_event" ADD COLUMN "source_context_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_execution_event" ADD CONSTRAINT "workflow_execution_event_run_id_node_execution_data_id_fk" FOREIGN KEY ("run_id") REFERENCES "node_execution_data"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_execution_event" ADD CONSTRAINT "workflow_execution_event_source_context_id_context_id_fk" FOREIGN KEY ("source_context_id") REFERENCES "context"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
