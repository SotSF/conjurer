import { router, userProcedure } from "@/src/server/trpc";
import { z } from "zod";
import { experiences, playlists, SelectUser } from "@/src/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  ALL_FINISHED_SMART_PLAYLIST,
  MY_EXPERIENCES_SMART_PLAYLIST,
  Playlist,
} from "@/src/types/Playlist";
import { ConjurerDatabase } from "@/src/db/type";

const getMyExperiencesSmartPlaylist = async (ctx: {
  db: ConjurerDatabase;
  user: SelectUser;
}) => ({
  ...MY_EXPERIENCES_SMART_PLAYLIST,
  name: `Experiences by ${ctx.user.username}`,
  orderedExperienceIds: (
    await ctx.db
      .select({ id: experiences.id })
      .from(experiences)
      .where(eq(experiences.userId, ctx.user.id))
      .orderBy(desc(experiences.updatedAt))
      .all()
  ).map(({ id }) => id),
});

const getAllFinishedSmartPlaylist = async (ctx: {
  db: ConjurerDatabase;
  user: SelectUser;
}) => ({
  ...ALL_FINISHED_SMART_PLAYLIST,
  orderedExperienceIds: (
    await ctx.db
      .select({ id: experiences.id })
      .from(experiences)
      .where(eq(experiences.status, "complete"))
      .all()
  )
    .map(({ id }) => id)
    // Shuffle the experiences
    .sort(() => Math.random() - 0.5),
});

export const playlistRouter = router({
  getPlaylist: userProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      let playlist: Playlist | undefined;
      if (input.id === MY_EXPERIENCES_SMART_PLAYLIST.id) {
        playlist = await getMyExperiencesSmartPlaylist(ctx);
      } else if (input.id === ALL_FINISHED_SMART_PLAYLIST.id) {
        playlist = await getAllFinishedSmartPlaylist(ctx);
      } else {
        playlist = await ctx.db.query.playlists
          .findFirst({
            where: eq(playlists.id, input.id),
            columns: {
              id: true,
              name: true,
              description: true,
              orderedExperienceIds: true,
            },
            with: { user: true },
          })
          .execute();
      }

      if (!playlist)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Playlist not found",
        });

      const playlistExperiences = await ctx.db.query.experiences
        .findMany({
          where: inArray(experiences.id, playlist.orderedExperienceIds),
          columns: {
            id: true,
            name: true,
            status: true,
            version: true,
            thumbnailURL: true,
          },
          with: {
            user: { columns: { id: true, username: true } },
            song: true,
          },
        })
        .execute();

      // Sort the experiences in the order they are in the playlist
      playlistExperiences.sort(
        (a, b) =>
          playlist.orderedExperienceIds.indexOf(a.id) -
          playlist.orderedExperienceIds.indexOf(b.id),
      );

      return { playlist, playlistExperiences };
    }),

  savePlaylist: userProcedure
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string(),
        description: z.string(),
        orderedExperienceIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, description, orderedExperienceIds } = input;

      const playlistData = {
        name,
        description,
        orderedExperienceIds,
      };

      let upsertedPlaylist;
      if (id) {
        [upsertedPlaylist] = await ctx.db
          .update(playlists)
          .set(playlistData)
          .where(eq(playlists.id, id))
          .returning()
          .execute();
      } else {
        [upsertedPlaylist] = await ctx.db
          .insert(playlists)
          .values({
            ...playlistData,
            userId: ctx.user.id,
          })
          .returning()
          .execute();
      }

      return (await ctx.db.query.playlists
        .findFirst({
          where: eq(playlists.id, upsertedPlaylist.id),
          columns: {
            id: true,
            name: true,
            description: true,
            orderedExperienceIds: true,
          },
          with: { user: true },
        })
        .execute())!;
    }),

  deletePlaylist: userProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(playlists)
        .where(eq(playlists.id, input.id))
        .execute();
    }),

  listPlaylists: userProcedure
    .input(
      z.object({
        allPlaylists: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const databasePlaylists = await ctx.db.query.playlists
        .findMany({
          where: input.allPlaylists
            ? undefined
            : eq(playlists.userId, ctx.user.id),
          columns: {
            id: true,
            name: true,
            description: true,
            orderedExperienceIds: true,
            isLocked: true,
          },
          with: { user: true },
        })
        .execute();

      const sortedPlaylists = databasePlaylists.sort((a, b) =>
        `${a.user.username}-${a.name}`.localeCompare(
          `${b.user.username}-${b.name}`,
        ),
      );

      return [
        await getAllFinishedSmartPlaylist(ctx),
        await getMyExperiencesSmartPlaylist(ctx),
        ...sortedPlaylists,
      ];
    }),
});
