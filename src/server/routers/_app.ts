import { audioRouter } from "@/src/server/routers/audioRouter";
import { experienceRouter } from "@/src/server/routers/experienceRouter";
import { router } from "../trpc";
import { beatMapRouter } from "@/src/server/routers/beatMapRouter";
import { userRouter } from "@/src/server/routers/userRouter";

export const appRouter = router({
  user: userRouter,
  experience: experienceRouter,
  audio: audioRouter,
  beatMap: beatMapRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
