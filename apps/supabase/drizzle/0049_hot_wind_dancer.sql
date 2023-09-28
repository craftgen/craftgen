CREATE TABLE IF NOT EXISTS "execution_graph" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" uuid NOT NULL,
	"source_node_id" uuid NOT NULL,
	"target_node_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "node_execution_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"state" json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "playground_execution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playground_id" uuid NOT NULL,
	"playground_version" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "playground" DROP CONSTRAINT IF EXISTS "playground_project_id_slug_unique";--> statement-breakpoint
ALTER TABLE "playground" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "execution_graph" ADD CONSTRAINT "execution_graph_execution_id_playground_execution_id_fk" FOREIGN KEY ("execution_id") REFERENCES "playground_execution"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "execution_graph" ADD CONSTRAINT "execution_graph_source_node_id_node_execution_data_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "node_execution_data"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "execution_graph" ADD CONSTRAINT "execution_graph_target_node_id_node_execution_data_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "node_execution_data"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_execution_data" ADD CONSTRAINT "node_execution_data_execution_id_playground_execution_id_fk" FOREIGN KEY ("execution_id") REFERENCES "playground_execution"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_execution_data" ADD CONSTRAINT "node_execution_data_node_id_node_data_id_fk" FOREIGN KEY ("node_id") REFERENCES "node_data"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playground_execution" ADD CONSTRAINT "playground_execution_playground_id_playground_id_fk" FOREIGN KEY ("playground_id") REFERENCES "playground"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "playground" ADD CONSTRAINT "playground_project_id_slug_version_unique" UNIQUE("project_id","slug","version");