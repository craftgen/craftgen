CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`website` text NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`logo` text,
	`db_url` text,
	`created_at` integer DEFAULT (cast(unixepoch() as int)),
	`updated_at` integer DEFAULT (cast(unixepoch() as int))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_idx` ON `organizations` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `username_idx` ON `organizations` (`username`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `organizations` (`name`);