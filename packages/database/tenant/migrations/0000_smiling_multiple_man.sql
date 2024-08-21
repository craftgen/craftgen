CREATE TABLE `context` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`workflow_id` text NOT NULL,
	`workflow_version_id` text NOT NULL,
	`parent_id` text,
	`previous_context_id` text,
	`type` text NOT NULL,
	`snapshot` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflow`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workflow_version_id`) REFERENCES `workflow_version`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`parent_id`) REFERENCES `context`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`machine_id` text NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`scheduled_for` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`locked_until` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`processing_started_at` integer
);
--> statement-breakpoint
CREATE TABLE `processed_events` (
	`id` text PRIMARY KEY NOT NULL,
	`machine_id` text NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`attempts` integer NOT NULL,
	`created_at` integer NOT NULL,
	`processing_started_at` integer NOT NULL,
	`processed_at` integer DEFAULT (unixepoch()) NOT NULL,
	`processing_duration` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `variable` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`is_system` integer DEFAULT false NOT NULL,
	`provider` text NOT NULL,
	`default` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text,
	`first_name` text,
	`last_name` text,
	`email` text,
	`username` text NOT NULL,
	`avatar_url` text,
	`created_at` integer DEFAULT (cast(unixepoch() as int)),
	`updated_at` integer DEFAULT (cast(unixepoch() as int))
);
--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo` text,
	`created_at` integer DEFAULT (cast(unixepoch() as int)),
	`updated_at` integer DEFAULT (cast(unixepoch() as int)),
	`database_name` text,
	`database_auth_token` text
);
--> statement-breakpoint
CREATE TABLE `organization_members` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch() as int)),
	`updated_at` integer DEFAULT (cast(unixepoch() as int))
);
--> statement-breakpoint
CREATE TABLE `workflow` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_slug` text NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`public` integer DEFAULT true,
	`layout` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`published_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workflow_edge` (
	`workflow_id` text NOT NULL,
	`workflow_version_id` text NOT NULL,
	`source` text NOT NULL,
	`source_output` text NOT NULL,
	`target` text NOT NULL,
	`target_input` text NOT NULL,
	PRIMARY KEY(`source`, `source_output`, `target`, `target_input`),
	FOREIGN KEY (`workflow_id`) REFERENCES `workflow`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workflow_version_id`) REFERENCES `workflow_version`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source`) REFERENCES `workflow_node`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target`) REFERENCES `workflow_node`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workflow_node` (
	`id` text PRIMARY KEY NOT NULL,
	`workflow_id` text NOT NULL,
	`workflow_version_id` text NOT NULL,
	`context_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`position` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`label` text NOT NULL,
	`description` text,
	`color` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflow`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workflow_version_id`) REFERENCES `workflow_version`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`context_id`) REFERENCES `context`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workflow_version` (
	`id` text PRIMARY KEY NOT NULL,
	`workflow_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`context_id` text,
	`previous_workflow_version_id` text,
	`version` integer DEFAULT 0 NOT NULL,
	`published_at` integer,
	`change_log` text DEFAULT 'Workin in progress',
	FOREIGN KEY (`workflow_id`) REFERENCES `workflow`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`context_id`) REFERENCES `context`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `variable_key_unique` ON `variable` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_idx` ON `organization` (`slug`);--> statement-breakpoint
CREATE INDEX `organization_name_idx` ON `organization` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `workflow_slug_unique_idx` ON `workflow` (`slug`,`organization_id`);--> statement-breakpoint
CREATE INDEX `workflow_name_idx` ON `workflow` (`name`);--> statement-breakpoint
CREATE INDEX `workflow_slug_idx` ON `workflow` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `workflow_version_workflow_id_version_unique` ON `workflow_version` (`workflow_id`,`version`);