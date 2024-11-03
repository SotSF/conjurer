import type { ExperienceStatus } from "../types/Experience";
import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  username: text("username").unique().notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),

  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull()
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

export const usersRelations = relations(users, ({ many }) => ({
  usersToExperiences: many(usersToExperiences),
}));

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const songs = sqliteTable(
  "songs",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    artist: text("artist").notNull().default(""),
    filename: text("filename").notNull(),

    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    songNameArtistIndex: uniqueIndex("song_name_artist_index").on(
      table.artist,
      table.name
    ),
  })
);

export const songsRelations = relations(songs, ({ many }) => ({
  experiences: many(experiences),
}));

export type InsertSong = typeof songs.$inferInsert;
export type SelectSong = typeof songs.$inferSelect;

export const experiences = sqliteTable(
  "experiences",
  {
    id: integer("id").primaryKey(),
    name: text("name").unique().notNull(),
    songId: integer("song_id").notNull(),
    status: text("status")
      .$type<ExperienceStatus>()
      .notNull()
      .default("inprogress"),
    data: text({ mode: "json" }).notNull(),
    version: integer("version").notNull().default(0),

    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    status_index: index("status_index").on(table.status),
  })
);

export const experiencesRelations = relations(experiences, ({ one, many }) => ({
  song: one(songs, { fields: [experiences.songId], references: [songs.id] }),
  usersToExperiences: many(usersToExperiences),
}));

export type InsertExperience = typeof experiences.$inferInsert;
export type SelectExperience = typeof experiences.$inferSelect;

export const usersToExperiences = sqliteTable(
  "users_to_experiences",
  {
    id: integer("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    experienceId: integer("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),

    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    userExperienceIndex: uniqueIndex("user_experience_index").on(
      table.userId,
      table.experienceId
    ),
  })
);

export const usersToExperiencesRelations = relations(
  usersToExperiences,
  ({ one }) => ({
    user: one(users, {
      fields: [usersToExperiences.userId],
      references: [users.id],
    }),
    experience: one(experiences, {
      fields: [usersToExperiences.experienceId],
      references: [experiences.id],
    }),
  })
);

export type InsertAuthorship = typeof usersToExperiences.$inferInsert;
export type SelectAuthorship = typeof usersToExperiences.$inferSelect;

export const playlists = sqliteTable(
  "playlists",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    isLocked: integer("is_locked", { mode: "boolean" })
      .notNull()
      .default(false),

    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    userIdIndex: index("user_id_index").on(table.userId),
  })
);

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, { fields: [playlists.userId], references: [users.id] }),
  playlistExperiences: many(playlistExperiences),
}));

export type InsertPlaylist = typeof playlists.$inferInsert;
export type SelectPlaylist = typeof playlists.$inferSelect;

export const playlistExperiences = sqliteTable(
  "playlist_experiences",
  {
    id: integer("id").primaryKey(),
    playlistId: integer("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    experienceId: integer("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),

    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    playlistIdExperienceIdIndex: uniqueIndex(
      "playlist_id_experience_id_index"
    ).on(table.playlistId, table.experienceId),
  })
);

export const playlistExperiencesRelations = relations(
  playlistExperiences,
  ({ one }) => ({
    playlist: one(playlists, {
      fields: [playlistExperiences.playlistId],
      references: [playlists.id],
    }),
    experience: one(experiences, {
      fields: [playlistExperiences.experienceId],
      references: [experiences.id],
    }),
  })
);

export type InsertPlaylistExperience = typeof playlistExperiences.$inferInsert;
export type SelectPlaylistExperience = typeof playlistExperiences.$inferSelect;
