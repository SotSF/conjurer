import { router, withDatabaseProcedure } from "@/src/server/trpc";
import { usersTable } from "@/src/db/schema";
import { z } from "zod";

export const userRouter = router({
  listUsers: withDatabaseProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(usersTable).execute();
  }),
  createUser: withDatabaseProcedure
    .input(
      z.object({
        username: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { username } = input;
      const [user] = await ctx.db
        .insert(usersTable)
        .values({ username })
        .returning()
        .execute();
      return user;
    }),
});
