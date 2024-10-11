import { audioRouter } from "@/src/server/routers/audioRouter";
import { experienceRouter } from "@/src/server/routers/experienceRouter";
import { publicProcedure, router } from "../trpc";
import { beatMapRouter } from "@/src/server/routers/beatMapRouter";
import { db } from "@/src/db/db";
import { usersTable } from "@/src/db/schema";

export const appRouter = router({
  experience: experienceRouter,
  audio: audioRouter,
  beatMap: beatMapRouter,

  // temporary
  getAllUsers: publicProcedure.query(
    async () => await db.select().from(usersTable).execute()
  ),
});

// export type definition of API
export type AppRouter = typeof appRouter;
