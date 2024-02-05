DROP TABLE "context_relation";--> statement-breakpoint
ALTER TABLE "context" ADD COLUMN "parent_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "context" ADD CONSTRAINT "context_parent_id_context_id_fk" FOREIGN KEY ("parent_id") REFERENCES "context"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
