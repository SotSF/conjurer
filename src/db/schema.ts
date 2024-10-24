import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
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

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

export const songsTable = sqliteTable(
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

export type InsertSong = typeof songsTable.$inferInsert;
export type SelectSong = typeof songsTable.$inferSelect;

export const experiencesTable = sqliteTable(
  "experiences",
  {
    id: integer("id").primaryKey(),
    name: text("name").unique().notNull(),
    songId: integer("song_id").notNull(),
    status: text("status").notNull().default("inprogress"),
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

export type InsertExperience = typeof experiencesTable.$inferInsert;
export type SelectExperience = typeof experiencesTable.$inferSelect;

export const authorshipTable = sqliteTable(
  "authorship",
  {
    id: integer("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    experienceId: integer("experience_id")
      .notNull()
      .references(() => experiencesTable.id, { onDelete: "cascade" }),

    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    experienceAuthorIndex: uniqueIndex("experience_author_index").on(
      table.userId,
      table.experienceId
    ),
  })
);

export type InsertAuthorship = typeof authorshipTable.$inferInsert;
export type SelectAuthorship = typeof authorshipTable.$inferSelect;

// TODO: playlists table
