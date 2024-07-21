CREATE TABLE `context` (
	`id` text PRIMARY KEY NOT NULL,
	`previous_context_id` text,
	`type` text NOT NULL,
	`snapshot` blob
);
