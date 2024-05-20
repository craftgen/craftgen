ALTER TABLE "workflow_execution" RENAME COLUMN "exit_node_id" TO "current_context_id";--> statement-breakpoint
ALTER TABLE "workflow_execution" DROP CONSTRAINT "workflow_execution_exit_node_id_workflow_node_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_execution" ADD CONSTRAINT "workflow_execution_current_context_id_context_id_fk" FOREIGN KEY ("current_context_id") REFERENCES "context"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
