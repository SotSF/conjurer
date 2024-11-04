import { router, databaseProcedure, userProcedure } from "@/src/server/trpc";
import { z } from "zod";
import { experiences, playlists } from "@/src/db/schema";
import { eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const playlistRouter = router({
  getPlaylist: databaseProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const playlist = await ctx.db.query.playlists
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

      if (!playlist)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Playlist not found",
        });

      const playlistExperiences = await ctx.db.query.experiences.findMany({
        where: inArray(experiences.id, playlist.orderedExperienceIds),
        columns: { id: true, name: true, status: true, version: true },
        with: {
          song: true,
        },
      });

      // Sort the experiences in the order they are in the playlist
      playlistExperiences.sort(
        (a, b) =>
          playlist.orderedExperienceIds.indexOf(a.id) -
          playlist.orderedExperienceIds.indexOf(b.id)
      );

      return { playlist, experiences: playlistExperiences };
    }),

  savePlaylist: userProcedure
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string(),
        description: z.string(),
        orderedExperienceIds: z.array(z.number()),
      })
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(playlists)
        .where(eq(playlists.id, input.id))
        .execute();
    }),

  listPlaylistsForUser: userProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.playlists
      .findMany({
        where: eq(playlists.userId, ctx.user.id),
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
  }),
});
