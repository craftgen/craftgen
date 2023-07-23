ALTER TABLE "data_row" DROP CONSTRAINT "data_row_data_set_id_data_set_id_fk";
--> statement-breakpoint
ALTER TABLE "data_set" DROP CONSTRAINT "data_set_project_id_project_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_row" ADD CONSTRAINT "data_row_data_set_id_data_set_id_fk" FOREIGN KEY ("data_set_id") REFERENCES "data_set"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_set" ADD CONSTRAINT "data_set_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
