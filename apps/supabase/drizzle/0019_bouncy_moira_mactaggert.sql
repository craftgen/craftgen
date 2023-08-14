ALTER TABLE "node_data" DROP CONSTRAINT "node_data_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "node_to_playground" DROP CONSTRAINT "node_to_playground_node_id_node_data_id_fk";
--> statement-breakpoint
ALTER TABLE "playground" DROP CONSTRAINT "playground_project_id_project_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_data" ADD CONSTRAINT "node_data_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_to_playground" ADD CONSTRAINT "node_to_playground_node_id_node_data_id_fk" FOREIGN KEY ("node_id") REFERENCES "node_data"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playground" ADD CONSTRAINT "playground_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
