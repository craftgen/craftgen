ALTER TABLE "context_relation" DROP CONSTRAINT "context_relation_source_target_type";--> statement-breakpoint
ALTER TABLE "workflow_edge" DROP CONSTRAINT "workflow_edge_source_target_source_output_target_input";--> statement-breakpoint
ALTER TABLE "context_relation" ADD CONSTRAINT "context_relation_source_target_type_pk" PRIMARY KEY("source","target","type");--> statement-breakpoint
ALTER TABLE "workflow_edge" ADD CONSTRAINT "workflow_edge_source_target_source_output_target_input_pk" PRIMARY KEY("source","target","source_output","target_input");