import { router, databaseProcedure } from "@/src/server/trpc";
import { songs } from "@/src/db/schema";
import { z } from "zod";

export const songRouter = router({
  listSongs: databaseProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(songs).execute();
  }),
  createSong: databaseProcedure
    .input(
      z.object({
        name: z.string(),
        artist: z.string(),
        filename: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, artist, filename } = input;
      const [song] = await ctx.db
        .insert(songs)
        .values({ name, artist, filename })
        .returning()
        .execute();
      return song;
    }),
});
