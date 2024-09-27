import { audioRouter } from "@/src/server/routers/audioRouter";
import { experienceRouter } from "@/src/server/routers/experienceRouter";
import { router } from "../trpc";
import { beatMapRouter } from "@/src/server/routers/beatMapRouter";

export const appRouter = router({
  experience: experienceRouter,
  audio: audioRouter,
  beatMap: beatMapRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
