CREATE TABLE IF NOT EXISTS "node_to_playground" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"playground_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_to_playground" ADD CONSTRAINT "node_to_playground_node_id_node_data_id_fk" FOREIGN KEY ("node_id") REFERENCES "node_data"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_to_playground" ADD CONSTRAINT "node_to_playground_playground_id_playground_id_fk" FOREIGN KEY ("playground_id") REFERENCES "playground"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
