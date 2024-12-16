import { router, databaseProcedure, userProcedure } from "@/src/server/trpc";
import { users } from "@/src/db/schema";
import { z } from "zod";

export const userRouter = router({
  listUsers: databaseProcedure.query(({ ctx }) =>
    ctx.db.select().from(users).execute(),
  ),

  getUser: userProcedure.query(({ ctx }) => ctx.user),

  createUser: databaseProcedure
    .input(
      z.object({
        username: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { username } = input;
      const [user] = await ctx.db
        .insert(users)
        .values({ username })
        .returning()
        .execute();
      return user;
    }),
});
