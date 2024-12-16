DROP TABLE `playlist_experiences`;--> statement-breakpoint
DROP INDEX IF EXISTS `playlist_user_index`;--> statement-breakpoint
ALTER TABLE `playlists` ADD `description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `playlists` ADD `orderedExperienceIds` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
CREATE INDEX `user_id_index` ON `playlists` (`user_id`);