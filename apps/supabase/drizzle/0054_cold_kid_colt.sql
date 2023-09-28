ALTER TABLE "playground" RENAME TO "workflow";--> statement-breakpoint
ALTER TABLE "playground_edge" RENAME TO "workflow_edge";--> statement-breakpoint
ALTER TABLE "playground_execution" RENAME TO "workflow_execution";--> statement-breakpoint
ALTER TABLE "execution_graph" RENAME TO "workflow_execution_step";--> statement-breakpoint
ALTER TABLE "playground_node" RENAME TO "workflow_node";--> statement-breakpoint
ALTER TABLE "playground_version" RENAME TO "workflow_version";--> statement-breakpoint
ALTER TABLE "node_execution_data" RENAME COLUMN "execution_id" TO "workflow_execution_id";--> statement-breakpoint
ALTER TABLE "workflow_edge" RENAME COLUMN "playground_id" TO "workflow_id";--> statement-breakpoint
ALTER TABLE "workflow_execution" RENAME COLUMN "playground_id" TO "workflow_id";--> statement-breakpoint
ALTER TABLE "workflow_execution" RENAME COLUMN "playground_version" TO "workflow_version_id";--> statement-breakpoint
ALTER TABLE "workflow_execution_step" RENAME COLUMN "execution_id" TO "workflow_execution_id";--> statement-breakpoint
ALTER TABLE "workflow_node" RENAME COLUMN "playground_id" TO "workflow_id";--> statement-breakpoint
ALTER TABLE "workflow_node" RENAME COLUMN "playground_version_id" TO "workflow_version_id";--> statement-breakpoint
ALTER TABLE "workflow_version" RENAME COLUMN "playground_id" TO "workflow_id";--> statement-breakpoint
ALTER TABLE "workflow" DROP CONSTRAINT "playground_project_id_slug_unique";--> statement-breakpoint
ALTER TABLE "workflow_version" DROP CONSTRAINT "playground_version_playground_id_version_unique";--> statement-breakpoint
ALTER TABLE "node_execution_data" DROP CONSTRAINT "node_execution_data_execution_id_playground_execution_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow" DROP CONSTRAINT "playground_project_slug_project_slug_fk";
--> statement-breakpoint
ALTER TABLE "workflow" DROP CONSTRAINT "playground_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_edge" DROP CONSTRAINT "playground_edge_playground_id_playground_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_edge" DROP CONSTRAINT "playground_edge_source_playground_node_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_edge" DROP CONSTRAINT "playground_edge_target_playground_node_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_execution" DROP CONSTRAINT "playground_execution_playground_id_playground_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_execution_step" DROP CONSTRAINT "execution_graph_execution_id_playground_execution_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_execution_step" DROP CONSTRAINT "execution_graph_source_node_id_node_execution_data_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_execution_step" DROP CONSTRAINT "execution_graph_target_node_id_node_execution_data_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_node" DROP CONSTRAINT "playground_node_id_node_data_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_node" DROP CONSTRAINT "playground_node_playground_id_playground_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_node" DROP CONSTRAINT "playground_node_playground_version_id_playground_version_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_version" DROP CONSTRAINT "playground_version_playground_id_playground_id_fk";
--> statement-breakpoint
ALTER TABLE "node_data" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "node_data" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "node_execution_data" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "node_execution_data" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "node_execution_data" ALTER COLUMN "node_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "node_execution_data" ALTER COLUMN "workflow_execution_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "workflow_edge" ALTER COLUMN "source" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow_edge" ALTER COLUMN "target" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow_edge" ALTER COLUMN "workflow_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow_execution" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow_execution" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "workflow_execution" ALTER COLUMN "workflow_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow_execution_step" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow_execution_step" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "workflow_execution_step" ALTER COLUMN "source_node_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow_execution_step" ALTER COLUMN "target_node_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow_execution_step" ALTER COLUMN "workflow_execution_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow_node" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow_node" ALTER COLUMN "workflow_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow_version" ALTER COLUMN "workflow_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow_edge" ADD COLUMN "workflow_version_id" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_execution_data" ADD CONSTRAINT "node_execution_data_workflow_execution_id_workflow_execution_id_fk" FOREIGN KEY ("workflow_execution_id") REFERENCES "workflow_execution"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow" ADD CONSTRAINT "workflow_project_slug_project_slug_fk" FOREIGN KEY ("project_slug") REFERENCES "project"("slug") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow" ADD CONSTRAINT "workflow_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_edge" ADD CONSTRAINT "workflow_edge_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "workflow"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_edge" ADD CONSTRAINT "workflow_edge_workflow_version_id_workflow_version_id_fk" FOREIGN KEY ("workflow_version_id") REFERENCES "workflow_version"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_edge" ADD CONSTRAINT "workflow_edge_source_workflow_node_id_fk" FOREIGN KEY ("source") REFERENCES "workflow_node"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_edge" ADD CONSTRAINT "workflow_edge_target_workflow_node_id_fk" FOREIGN KEY ("target") REFERENCES "workflow_node"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_execution" ADD CONSTRAINT "workflow_execution_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "workflow"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_execution" ADD CONSTRAINT "workflow_execution_workflow_version_id_workflow_version_id_fk" FOREIGN KEY ("workflow_version_id") REFERENCES "workflow_version"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_execution_step" ADD CONSTRAINT "workflow_execution_step_workflow_execution_id_workflow_execution_id_fk" FOREIGN KEY ("workflow_execution_id") REFERENCES "workflow_execution"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_execution_step" ADD CONSTRAINT "workflow_execution_step_source_node_id_node_execution_data_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "node_execution_data"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_execution_step" ADD CONSTRAINT "workflow_execution_step_target_node_id_node_execution_data_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "node_execution_data"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_node" ADD CONSTRAINT "workflow_node_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "workflow"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_node" ADD CONSTRAINT "workflow_node_workflow_version_id_workflow_version_id_fk" FOREIGN KEY ("workflow_version_id") REFERENCES "workflow_version"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_version" ADD CONSTRAINT "workflow_version_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "workflow"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_project_id_slug_unique" UNIQUE("project_id","slug");--> statement-breakpoint
ALTER TABLE "workflow_version" ADD CONSTRAINT "workflow_version_workflow_id_version_unique" UNIQUE("workflow_id","version");