ALTER TABLE "workflow_version" ADD COLUMN "context_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_version" ADD CONSTRAINT "workflow_version_context_id_context_id_fk" FOREIGN KEY ("context_id") REFERENCES "context"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
