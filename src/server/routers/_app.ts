import { router } from "../trpc";

import { experienceRouter } from "@/src/server/routers/experienceRouter";

export const appRouter = router({
  experience: experienceRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
