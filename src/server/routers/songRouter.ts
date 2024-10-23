import { router, withDatabaseProcedure } from "@/src/server/trpc";
import { songsTable } from "@/src/db/schema";
import { z } from "zod";

export const songRouter = router({
  listSongs: withDatabaseProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(songsTable).execute();
  }),
  createSong: withDatabaseProcedure
    .input(
      z.object({
        name: z.string(),
        artist: z.string(),
        s3Path: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, artist, s3Path } = input;
      const [song] = await ctx.db
        .insert(songsTable)
        .values({ name, artist, s3Path })
        .returning()
        .execute();
      return song;
    }),
});
