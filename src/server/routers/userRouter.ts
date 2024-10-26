import { router, databaseProcedure } from "@/src/server/trpc";
import { users } from "@/src/db/schema";
import { z } from "zod";

export const userRouter = router({
  listUsers: databaseProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(users).execute();
  }),
  createUser: databaseProcedure
    .input(
      z.object({
        username: z.string(),
      })
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
