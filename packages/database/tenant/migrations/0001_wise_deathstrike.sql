ALTER TABLE `organization` ADD `personal` integer NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);
