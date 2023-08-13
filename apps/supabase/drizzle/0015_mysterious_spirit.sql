ALTER TABLE "article_node" ADD COLUMN "url" text;--> statement-breakpoint
ALTER TABLE "article_node" ADD COLUMN "width" integer;--> statement-breakpoint
ALTER TABLE "article_node" ADD COLUMN "caption" json;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_node" ADD CONSTRAINT "article_node_article_id_article_id_fk" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
