CREATE TABLE IF NOT EXISTS "playground_edge" (
	"playground_id" uuid NOT NULL,
	"source" uuid NOT NULL,
	"source_output" text NOT NULL,
	"target" uuid NOT NULL,
	"target_input" text NOT NULL,
	CONSTRAINT playground_edge_source_target_source_output_target_input PRIMARY KEY("source","target","source_output","target_input")
);
--> statement-breakpoint
ALTER TABLE "node_to_playground" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playground_edge" ADD CONSTRAINT "playground_edge_playground_id_playground_id_fk" FOREIGN KEY ("playground_id") REFERENCES "playground"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playground_edge" ADD CONSTRAINT "playground_edge_source_node_data_id_fk" FOREIGN KEY ("source") REFERENCES "node_data"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playground_edge" ADD CONSTRAINT "playground_edge_target_node_data_id_fk" FOREIGN KEY ("target") REFERENCES "node_data"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
