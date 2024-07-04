ALTER TABLE "workflow_execution" RENAME COLUMN "finished_at" TO "completed_at";--> statement-breakpoint
ALTER TABLE "node_execution_data" DROP CONSTRAINT "node_execution_data_workflow_node_id_workflow_node_id_fk";
--> statement-breakpoint
ALTER TABLE "node_execution_data" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "node_execution_data" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "node_execution_data" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "node_execution_data" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "workflow_execution" ADD COLUMN "duration" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_execution_data" ADD CONSTRAINT "node_execution_data_workflow_node_id_workflow_node_id_fk" FOREIGN KEY ("workflow_node_id") REFERENCES "workflow_node"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
