ALTER TABLE "article_node" RENAME COLUMN "children" TO "data";--> statement-breakpoint
ALTER TABLE "article_node" DROP COLUMN IF EXISTS "url";--> statement-breakpoint
ALTER TABLE "article_node" DROP COLUMN IF EXISTS "width";--> statement-breakpoint
ALTER TABLE "article_node" DROP COLUMN IF EXISTS "caption";