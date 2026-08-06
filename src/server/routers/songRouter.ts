import { router, databaseProcedure } from "@/src/server/trpc";
import { songs } from "@/src/db/schema";
import type { SerializedBeatGrid } from "@/src/types/BeatGrid";
import { eq } from "drizzle-orm";
import { z } from "zod";

const beatGridSchema = z.object({
  anchors: z
    .object({ time: z.number(), beat: z.number() })
    .array()
    .min(1)
    .max(256),
  trailingBpm: z.number(),
  beatsPerBar: z.number(),
  downbeat: z.number(),
  source: z.enum(["auto", "manual"]),
  confidence: z.number(),
});

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
  setBeatGrid: databaseProcedure
    .input(
      z.object({
        songId: z.number(),
        beatGrid: beatGridSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(songs)
        .set({ beatGrid: input.beatGrid as SerializedBeatGrid })
        .where(eq(songs.id, input.songId))
        .execute();
    }),
});
