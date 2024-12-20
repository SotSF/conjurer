import type { ExperienceStatus } from "../types/Experience";
import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull()
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
};

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  username: text("username").unique().notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

export const usersRelations = relations(users, ({ many }) => ({
  experiences: many(experiences),
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
    ...timestamps,
  },
  (table) => ({
    songNameArtistIndex: uniqueIndex("song_name_artist_index").on(
      table.artist,
      table.name,
    ),
  }),
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
    userId: integer("user_id").notNull(),
    thumbnailURL: text("thumbnail_url").notNull().default(""),

    ...timestamps,
  },
  (table) => ({
    status_index: index("status_index").on(table.status),
  }),
);

export const experiencesRelations = relations(experiences, ({ one }) => ({
  song: one(songs, { fields: [experiences.songId], references: [songs.id] }),
  user: one(users, { fields: [experiences.userId], references: [users.id] }),
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

    ...timestamps,
  },
  (table) => ({
    userExperienceIndex: uniqueIndex("user_experience_index").on(
      table.userId,
      table.experienceId,
    ),
  }),
);

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
    orderedExperienceIds: text({ mode: "json" })
      .$type<number[]>()
      .notNull()
      .default([]),

    ...timestamps,
  },
  (table) => ({
    userIdIndex: index("user_id_index").on(table.userId),
  }),
);

export const playlistsRelations = relations(playlists, ({ one }) => ({
  user: one(users, { fields: [playlists.userId], references: [users.id] }),
}));

export type InsertPlaylist = typeof playlists.$inferInsert;
export type SelectPlaylist = typeof playlists.$inferSelect;
