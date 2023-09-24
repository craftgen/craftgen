ALTER TABLE "playground_node" ADD COLUMN "position" json NOT NULL;--> statement-breakpoint
ALTER TABLE "playground_node" ADD COLUMN "width" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "playground_node" ADD COLUMN "height" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "playground_node" ADD COLUMN "label" text NOT NULL;--> statement-breakpoint
ALTER TABLE "playground_node" ADD COLUMN "color" text NOT NULL;--> statement-breakpoint
ALTER TABLE "playground_node" DROP COLUMN IF EXISTS "data";