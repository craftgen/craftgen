DO $$ BEGIN
 ALTER TABLE "node_to_playground" ADD CONSTRAINT "node_to_playground_playground_id_playground_id_fk" FOREIGN KEY ("playground_id") REFERENCES "playground"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
