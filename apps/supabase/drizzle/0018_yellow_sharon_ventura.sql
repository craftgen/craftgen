ALTER TABLE "playground" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "playground" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;