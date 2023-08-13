DO $$ BEGIN
 ALTER TABLE "article" ADD CONSTRAINT "article_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "article" DROP COLUMN IF EXISTS "content";