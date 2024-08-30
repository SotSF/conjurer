import { audioRouter } from "@/src/server/routers/audioRouter";
import { experienceRouter } from "@/src/server/routers/experienceRouter";
import { router } from "../trpc";

export const appRouter = router({
  experience: experienceRouter,
  audio: audioRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
