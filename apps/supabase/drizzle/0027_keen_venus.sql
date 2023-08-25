ALTER TABLE "playground" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "playground" ADD COLUMN "public" boolean DEFAULT false NOT NULL;