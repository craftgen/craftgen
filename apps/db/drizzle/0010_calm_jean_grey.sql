CREATE TABLE IF NOT EXISTS "context_relation" (
	"source" text NOT NULL,
	"type" text NOT NULL,
	"target" text NOT NULL,
	CONSTRAINT context_relation_source_target_type PRIMARY KEY("source","target","type")
);
--> statement-breakpoint
ALTER TABLE "context" ADD COLUMN "workflow_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "context" ADD COLUMN "workflow_version_id" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "context" ADD CONSTRAINT "context_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "workflow"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "context" ADD CONSTRAINT "context_workflow_version_id_workflow_version_id_fk" FOREIGN KEY ("workflow_version_id") REFERENCES "workflow_version"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "context_relation" ADD CONSTRAINT "context_relation_source_context_id_fk" FOREIGN KEY ("source") REFERENCES "context"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "context_relation" ADD CONSTRAINT "context_relation_target_context_id_fk" FOREIGN KEY ("target") REFERENCES "context"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
