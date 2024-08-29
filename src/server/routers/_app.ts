import { z } from "zod";
import { publicProcedure, router } from "../trpc";

import { experienceRouter } from "@/src/server/routers/experienceRouter";

export const appRouter = router({
  hello: publicProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),

  experience: experienceRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
