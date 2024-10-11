import { audioRouter } from "@/src/server/routers/audioRouter";
import { experienceRouter } from "@/src/server/routers/experienceRouter";
import { router, withDatabaseProcedure } from "../trpc";
import { beatMapRouter } from "@/src/server/routers/beatMapRouter";
import { usersTable } from "@/src/db/schema";

export const appRouter = router({
  experience: experienceRouter,
  audio: audioRouter,
  beatMap: beatMapRouter,

  // temporary
  getAllUsers: withDatabaseProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(usersTable).execute();
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
