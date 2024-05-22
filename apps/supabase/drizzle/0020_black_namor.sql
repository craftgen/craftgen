ALTER TABLE "workflow_execution_event" DROP CONSTRAINT "workflow_execution_event_source_node_id_node_execution_data_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_execution_event" DROP CONSTRAINT "workflow_execution_event_target_node_id_node_execution_data_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_execution_event" ADD COLUMN "run_id" text;--> statement-breakpoint
ALTER TABLE "workflow_execution_event" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_execution_event" ADD COLUMN "status" text DEFAULT 'queued' NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_execution_event" DROP COLUMN IF EXISTS "source_node_id";--> statement-breakpoint
ALTER TABLE "workflow_execution_event" DROP COLUMN IF EXISTS "target_node_id";