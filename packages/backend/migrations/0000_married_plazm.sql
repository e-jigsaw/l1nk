CREATE TABLE `links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_page_id` text NOT NULL,
	`target_page_slug` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`source_page_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `source_idx` ON `links` (`source_page_id`);--> statement-breakpoint
CREATE INDEX `target_idx` ON `links` (`target_page_slug`);--> statement-breakpoint
CREATE TABLE `page_snapshots` (
	`page_id` text NOT NULL,
	`lines_json` text NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` text PRIMARY KEY NOT NULL,
	`project` text DEFAULT 'default' NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`image_url` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`views` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `slug_idx` ON `pages` (`slug`);--> statement-breakpoint
CREATE INDEX `project_idx` ON `pages` (`project`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`auth_provider` text NOT NULL,
	`auth_provider_id` text NOT NULL,
	`name` text,
	`display_name` text,
	`photo_url` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);