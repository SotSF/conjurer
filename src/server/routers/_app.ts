import { experienceRouter } from "@/src/server/routers/experienceRouter";
import { router } from "../trpc";
import { beatMapRouter } from "@/src/server/routers/beatMapRouter";
import { userRouter } from "@/src/server/routers/userRouter";
import { songRouter } from "@/src/server/routers/songRouter";

export const appRouter = router({
  user: userRouter,
  song: songRouter,
  experience: experienceRouter,
  beatMap: beatMapRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
