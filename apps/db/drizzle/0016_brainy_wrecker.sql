ALTER TABLE "context" DROP CONSTRAINT "context_workflow_version_id_workflow_version_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "context" ADD CONSTRAINT "context_workflow_version_id_workflow_version_id_fk" FOREIGN KEY ("workflow_version_id") REFERENCES "workflow_version"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
