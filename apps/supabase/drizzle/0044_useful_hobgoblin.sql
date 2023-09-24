ALTER TABLE "node_to_playground" RENAME TO "playground_node";--> statement-breakpoint
ALTER TABLE "playground_node" DROP CONSTRAINT "node_to_playground_node_id_node_data_id_fk";
--> statement-breakpoint
ALTER TABLE "playground_node" DROP CONSTRAINT "node_to_playground_playground_id_playground_id_fk";
--> statement-breakpoint
ALTER TABLE "playground_node" ADD COLUMN "data" json NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playground_node" ADD CONSTRAINT "playground_node_node_id_node_data_id_fk" FOREIGN KEY ("node_id") REFERENCES "node_data"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playground_node" ADD CONSTRAINT "playground_node_playground_id_playground_id_fk" FOREIGN KEY ("playground_id") REFERENCES "playground"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
