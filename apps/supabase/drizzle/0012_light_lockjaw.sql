CREATE TABLE IF NOT EXISTS "link" (
	"id" uuid PRIMARY KEY NOT NULL,
	"article_node_id" uuid NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"article_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "article_node" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"type" text NOT NULL,
	"children" json NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" RENAME TO "article";