ALTER TABLE "playground_edge" DROP CONSTRAINT "playground_edge_source_node_data_id_fk";
--> statement-breakpoint
ALTER TABLE "playground_edge" DROP CONSTRAINT "playground_edge_target_node_data_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playground_edge" ADD CONSTRAINT "playground_edge_source_playground_node_id_fk" FOREIGN KEY ("source") REFERENCES "playground_node"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playground_edge" ADD CONSTRAINT "playground_edge_target_playground_node_id_fk" FOREIGN KEY ("target") REFERENCES "playground_node"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
