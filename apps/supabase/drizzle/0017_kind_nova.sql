ALTER TABLE "article" DROP CONSTRAINT "article_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "article_node" DROP CONSTRAINT "article_node_article_id_article_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article" ADD CONSTRAINT "article_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_node" ADD CONSTRAINT "article_node_article_id_article_id_fk" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
