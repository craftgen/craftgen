ALTER TABLE "playground_node" DROP CONSTRAINT "playground_node_node_id_node_data_id_fk";
--> statement-breakpoint
ALTER TABLE "playground_node" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playground_node" ADD CONSTRAINT "playground_node_id_node_data_id_fk" FOREIGN KEY ("id") REFERENCES "node_data"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "playground_node" DROP COLUMN IF EXISTS "node_id";