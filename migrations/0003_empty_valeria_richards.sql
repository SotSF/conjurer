CREATE TABLE `experiences_tmp` (
        `id` integer PRIMARY KEY NOT NULL,
        `name` text NOT NULL,
        `song_id` integer NOT NULL,
        `status` text DEFAULT 'inprogress' NOT NULL,
        `data` text NOT NULL,
        `version` integer DEFAULT 0 NOT NULL,
        `created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
        `updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
        `user_id` integer
);
--> statement-breakpoint
INSERT INTO `experiences_tmp` (id, name, song_id, status, data, version, created_at, updated_at, user_id)
  SELECT e.id, e.name, e.song_id, e.status, e.data, e.version, e.created_at, e.updated_at, NULL
    FROM experiences e;
--> statement-breakpoint
UPDATE experiences_tmp SET user_id = (
  SELECT user_id
    FROM users_to_experiences
    WHERE experiences_tmp.id = users_to_experiences.experience_id
    LIMIT 1
);
--> statement-breakpoint
ALTER TABLE `experiences` RENAME TO `experiences_old`;
--> statement-breakpoint
CREATE TABLE `experiences` (
        `id` integer PRIMARY KEY NOT NULL,
        `name` text NOT NULL,
        `song_id` integer NOT NULL,
        `status` text DEFAULT 'inprogress' NOT NULL,
        `data` text NOT NULL,
        `version` integer DEFAULT 0 NOT NULL,
        `created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
        `updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
        `user_id` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO experiences (id, name, song_id, status, data, version, created_at, updated_at, user_id)
  SELECT id, name, song_id, status, data, version, created_at, updated_at, user_id
    FROM experiences_tmp;
--> statement-breakpoint
DROP TABLE experiences_tmp;
--> statement-breakpoint
DROP TABLE experiences_old;
--> statement-breakpoint
DROP TABLE users_to_experiences;
