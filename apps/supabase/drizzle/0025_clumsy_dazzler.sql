DO $$ BEGIN
 ALTER TABLE "node_to_playground" ADD CONSTRAINT "node_to_playground_node_id_node_data_id_fk" FOREIGN KEY ("node_id") REFERENCES "node_data"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
