ALTER TABLE "workflow_execution_event" DROP CONSTRAINT "workflow_execution_event_run_id_node_execution_data_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_execution_event" ADD COLUMN "state" json;