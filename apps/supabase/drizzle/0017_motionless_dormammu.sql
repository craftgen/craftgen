CREATE TABLE IF NOT EXISTS "directus_roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"icon" varchar(30) DEFAULT 'supervised_user_circle' NOT NULL,
	"description" text,
	"ip_access" text,
	"enforce_tfa" boolean DEFAULT false NOT NULL,
	"admin_access" boolean DEFAULT false NOT NULL,
	"app_access" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "directus_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" varchar(50),
	"last_name" varchar(50),
	"email" varchar(128),
	"password" varchar(255),
	"location" varchar(255),
	"title" varchar(50),
	"description" text,
	"tags" json,
	"avatar" uuid,
	"language" varchar(255),
	"tfa_secret" varchar(255),
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"role" uuid,
	"token" varchar(255),
	"last_access" timestamp with time zone,
	"last_page" varchar(255),
	"provider" varchar(128) DEFAULT 'default' NOT NULL,
	"external_identifier" varchar(255),
	"auth_data" json,
	"email_notifications" boolean DEFAULT true,
	"appearance" varchar(255),
	"theme_dark" varchar(255),
	"theme_light" varchar(255),
	"theme_light_overrides" json,
	"theme_dark_overrides" json,
	CONSTRAINT "directus_users_email_unique" UNIQUE("email"),
	CONSTRAINT "directus_users_token_unique" UNIQUE("token"),
	CONSTRAINT "directus_users_external_identifier_unique" UNIQUE("external_identifier")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integration" (
	"id" uuid PRIMARY KEY NOT NULL,
	"status" varchar(255) DEFAULT 'draft' NOT NULL,
	"sort" integer,
	"user_created" uuid,
	"date_created" timestamp with time zone,
	"user_updated" uuid,
	"date_updated" timestamp with time zone,
	"slug" varchar(255),
	"featured" boolean DEFAULT false,
	"icon" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integration_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"status" varchar(255) DEFAULT 'draft' NOT NULL,
	"sort" integer,
	"user_created" uuid,
	"date_created" timestamp with time zone,
	"user_updated" uuid,
	"date_updated" timestamp with time zone,
	"slug" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integration_categories_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"integration_categories_id" uuid,
	"languages_code" varchar(255),
	"name" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integration_integration_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"integration_id" uuid,
	"integration_categories_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integration_solution" (
	"id" serial PRIMARY KEY NOT NULL,
	"integration_id" uuid,
	"solution_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integration_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"integration_id" uuid,
	"languages_code" varchar(255),
	"name" varchar(255),
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "languages" (
	"code" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"direction" varchar(255) DEFAULT 'ltr'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solution" (
	"id" uuid PRIMARY KEY NOT NULL,
	"status" varchar(255) DEFAULT 'draft' NOT NULL,
	"sort" integer,
	"user_created" uuid,
	"date_created" timestamp with time zone,
	"user_updated" uuid,
	"date_updated" timestamp with time zone,
	"slug" varchar(255),
	CONSTRAINT "solution_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solution_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"solution_id" uuid,
	"languages_code" varchar(255),
	"name" varchar(255),
	"title" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_execution_event" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_execution_id" text NOT NULL,
	"run_id" text,
	"source_context_id" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"event" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "workflow_execution_step";--> statement-breakpoint
ALTER TABLE "workflow_execution" DROP CONSTRAINT "workflow_execution_entry_node_id_workflow_node_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_execution" DROP CONSTRAINT "workflow_execution_exit_node_id_workflow_node_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_execution" ADD COLUMN "state" json;--> statement-breakpoint
ALTER TABLE "workflow_execution" ADD COLUMN "entry_context_id" text;--> statement-breakpoint
ALTER TABLE "workflow_execution" ADD COLUMN "current_context_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_execution" ADD CONSTRAINT "workflow_execution_entry_context_id_context_id_fk" FOREIGN KEY ("entry_context_id") REFERENCES "context"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_execution" ADD CONSTRAINT "workflow_execution_current_context_id_context_id_fk" FOREIGN KEY ("current_context_id") REFERENCES "context"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "workflow_execution" DROP COLUMN IF EXISTS "entry_node_id";--> statement-breakpoint
ALTER TABLE "workflow_execution" DROP COLUMN IF EXISTS "exit_node_id";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "directus_users" ADD CONSTRAINT "directus_users_role_directus_roles_id_fk" FOREIGN KEY ("role") REFERENCES "directus_roles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration" ADD CONSTRAINT "integration_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "directus_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration" ADD CONSTRAINT "integration_user_updated_directus_users_id_fk" FOREIGN KEY ("user_updated") REFERENCES "directus_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_categories" ADD CONSTRAINT "integration_categories_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "directus_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_categories" ADD CONSTRAINT "integration_categories_user_updated_directus_users_id_fk" FOREIGN KEY ("user_updated") REFERENCES "directus_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_categories_translations" ADD CONSTRAINT "integration_categories_translations_integration_categories_id_integration_categories_id_fk" FOREIGN KEY ("integration_categories_id") REFERENCES "integration_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_categories_translations" ADD CONSTRAINT "integration_categories_translations_languages_code_languages_code_fk" FOREIGN KEY ("languages_code") REFERENCES "languages"("code") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_integration_categories" ADD CONSTRAINT "integration_integration_categories_integration_id_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "integration"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_integration_categories" ADD CONSTRAINT "integration_integration_categories_integration_categories_id_integration_categories_id_fk" FOREIGN KEY ("integration_categories_id") REFERENCES "integration_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_solution" ADD CONSTRAINT "integration_solution_integration_id_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "integration"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_solution" ADD CONSTRAINT "integration_solution_solution_id_solution_id_fk" FOREIGN KEY ("solution_id") REFERENCES "solution"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_translations" ADD CONSTRAINT "integration_translations_integration_id_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "integration"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_translations" ADD CONSTRAINT "integration_translations_languages_code_languages_code_fk" FOREIGN KEY ("languages_code") REFERENCES "languages"("code") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "solution" ADD CONSTRAINT "solution_user_created_directus_users_id_fk" FOREIGN KEY ("user_created") REFERENCES "directus_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "solution" ADD CONSTRAINT "solution_user_updated_directus_users_id_fk" FOREIGN KEY ("user_updated") REFERENCES "directus_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "solution_translations" ADD CONSTRAINT "solution_translations_solution_id_solution_id_fk" FOREIGN KEY ("solution_id") REFERENCES "solution"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "solution_translations" ADD CONSTRAINT "solution_translations_languages_code_languages_code_fk" FOREIGN KEY ("languages_code") REFERENCES "languages"("code") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_execution_event" ADD CONSTRAINT "workflow_execution_event_workflow_execution_id_workflow_execution_id_fk" FOREIGN KEY ("workflow_execution_id") REFERENCES "workflow_execution"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow_execution_event" ADD CONSTRAINT "workflow_execution_event_source_context_id_context_id_fk" FOREIGN KEY ("source_context_id") REFERENCES "context"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
