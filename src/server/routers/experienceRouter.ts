import { router, withDatabaseProcedure } from "@/src/server/trpc";
import { z } from "zod";
import { experiences, users, usersToExperiences } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { TRPCClientError } from "@trpc/client";
import { EXPERIENCE_STATUSES } from "@/src/types/Experience";

export const experienceRouter = router({
  listExperiences: withDatabaseProcedure
    .input(
      z.object({
        username: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.username) {
        return await ctx.db.query.experiences
          .findMany({ columns: { id: true, name: true } })
          .execute();
      }

      // Approach 1: uses db.select and only requires one query, but the types are nullable in the end for some reason
      // return await ctx.db
      //   .select({ id: experiences.id, name: experiences.name })
      //   .from(usersToExperiences)
      //   .leftJoin(users, eq(usersToExperiences.userId , users.id))
      //   .leftJoin(
      //     experiences,
      //     eq(usersToExperiences.experienceId, experiences.id)
      //   )
      //   .where(eq(users.username, input.username))
      //   .all();

      // Approach 2: uses db.query and one query, but currently nested select filters are not supported. They will be supported in the future.
      // return await ctx.db.query.usersToExperiences
      //   .findMany({
      //     columns: {},
      //     with: {
      //       user: {
      //         columns: { username: true },
      //         where: (users, { eq }) => eq(users.username, input.username),
      //       },
      //       experience: { columns: { id: true, name: true } },
      //     },
      //   })
      //   .execute();

      // Approach 3: uses db.query which is nice but requires 2 queries
      const user = await ctx.db.query.users
        .findFirst({ where: eq(users.username, input.username) })
        .execute();
      if (!user) return [];

      return (
        await ctx.db.query.usersToExperiences
          .findMany({
            where: eq(usersToExperiences.userId, user.id),
            columns: {},
            with: {
              experience: {
                columns: { id: true, name: true },
              },
            },
          })
          .execute()
      ).map(({ experience }) => experience);
    }),

  saveExperience: withDatabaseProcedure
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string(),
        song: z.object({ id: z.number() }),
        data: z.any(),
        status: z.enum(EXPERIENCE_STATUSES),
        version: z.number(),
        username: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, song, data, status, version, username } = input;
      const { id: songId } = song;

      // TODO: incorporate this as middleware
      const user = await ctx.db.query.users
        .findFirst({ where: eq(users.username, username) })
        .execute();

      if (!user) {
        throw new TRPCClientError("User not found");
      }

      // TODO: handle case where no id is provided and there is a name conflict (shouldn't overwrite)
      const [affectedExperience] = await ctx.db
        .insert(experiences)
        .values({ id, name, songId, data, status, version })
        .onConflictDoUpdate({
          target: [experiences.id],
          set: { name, songId, data, status, version },
        })
        .returning({ id: experiences.id })
        .execute();

      await ctx.db
        .insert(usersToExperiences)
        .values({
          userId: user.id,
          experienceId: affectedExperience.id,
        })
        .onConflictDoNothing()
        .execute();

      return affectedExperience.id;
    }),

  getExperience: withDatabaseProcedure
    .input(
      z.object({
        experienceName: z.string(),
        usingLocalData: z.boolean(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.experiences
        .findFirst({
          with: { song: true },
          where: eq(experiences.name, input.experienceName),
        })
        .execute();
    }),
});
