CREATE TABLE IF NOT EXISTS "node_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playground_id" uuid NOT NULL,
	"type" text NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_data" ADD CONSTRAINT "node_data_playground_id_playground_id_fk" FOREIGN KEY ("playground_id") REFERENCES "playground"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
