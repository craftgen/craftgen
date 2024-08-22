CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo` text,
	`personal` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch() as int)),
	`updated_at` integer DEFAULT (cast(unixepoch() as int)),
	`database_name` text NOT NULL,
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
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_idx` ON `organization` (`slug`);--> statement-breakpoint
CREATE INDEX `organization_name_idx` ON `organization` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `workflow_slug_unique_idx` ON `workflow` (`slug`,`organization_id`);--> statement-breakpoint
CREATE INDEX `workflow_name_idx` ON `workflow` (`name`);--> statement-breakpoint
CREATE INDEX `workflow_slug_idx` ON `workflow` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `workflow_version_workflow_id_version_unique` ON `workflow_version` (`workflow_id`,`version`);