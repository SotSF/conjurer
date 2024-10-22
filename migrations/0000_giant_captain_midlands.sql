CREATE TABLE `authorship` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`experience_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`experience_id`) REFERENCES `experiences`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `experience_author_index` ON `authorship` (`user_id`,`experience_id`);--> statement-breakpoint
CREATE TABLE `experiences` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`song_id` integer NOT NULL,
	`status` text DEFAULT 'inprogress',
	`data` text,
	`version` integer DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `experiences_name_unique` ON `experiences` (`name`);--> statement-breakpoint
CREATE INDEX `status_index` ON `experiences` (`status`);--> statement-breakpoint
CREATE TABLE `songs` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`artist` text DEFAULT '',
	`s3_path` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `song_name_artist_index` ON `songs` (`artist`,`name`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`is_admin` integer DEFAULT false,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);