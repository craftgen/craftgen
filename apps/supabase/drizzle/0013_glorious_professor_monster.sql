ALTER TABLE "node_execution_data" DROP CONSTRAINT "node_execution_data_workflow_node_id_workflow_node_id_fk";
--> statement-breakpoint
ALTER TABLE "node_execution_data" DROP COLUMN IF EXISTS "workflow_node_id";