DO $$ BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'workflow_version' 
      AND column_name = 'context_id'
  ) THEN
      -- Add the column if it doesn't exist
      ALTER TABLE "workflow_version" ADD COLUMN "context_id" text;
  END IF;
  ALTER TABLE "workflow_version" ADD CONSTRAINT "workflow_version_context_id_context_id_fk" FOREIGN KEY ("context_id") REFERENCES "context"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
