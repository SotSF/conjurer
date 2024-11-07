import { router, databaseProcedure, userProcedure } from "@/src/server/trpc";
import { z } from "zod";
import { experiences, users, usersToExperiences } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { EXPERIENCE_STATUSES } from "@/src/types/Experience";
import { TRPCError } from "@trpc/server";

export const experienceRouter = router({
  listExperiencesForUser: userProcedure.query(async ({ ctx }) => {
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

    // Approach 3: uses db.query which is nice but requires 2 queries (the below one and the one in userProcedure)
    return (
      await ctx.db.query.usersToExperiences
        .findMany({
          where: eq(usersToExperiences.userId, ctx.user.id),
          columns: {},
          with: {
            experience: { columns: { id: true, name: true } },
          },
        })
        .execute()
    ).map(({ experience }) => experience);
  }),

  listExperiencesAndUsers: databaseProcedure
    .input(
      z.object({
        username: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.username) {
        return await ctx.db.query.usersToExperiences
          .findMany({
            columns: {},
            with: {
              user: { columns: { username: true } },
              experience: {
                columns: { id: true, name: true, status: true, version: true },
                with: { song: true },
              },
            },
          })
          .execute();
      }

      const user = await ctx.db.query.users
        .findFirst({ where: eq(users.username, input.username) })
        .execute();
      if (!user) return [];

      return await ctx.db.query.usersToExperiences
        .findMany({
          where: eq(usersToExperiences.userId, user.id),
          columns: {},
          with: {
            user: { columns: { username: true } },
            experience: {
              columns: { id: true, name: true, status: true, version: true },
              with: { song: { columns: { name: true, artist: true } } },
            },
          },
        })
        .execute();
    }),

  saveExperience: userProcedure
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string(),
        song: z.object({ id: z.number() }),
        data: z.any(),
        status: z.enum(EXPERIENCE_STATUSES),
        version: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, song, data, status, version } = input;
      const { id: songId } = song;

      if (id) {
        // Check if the user has permission to save this experience
        const userToExperience = await ctx.db.query.usersToExperiences
          .findFirst({
            where: eq(usersToExperiences.experienceId, id),
          })
          .execute();

        if (userToExperience?.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              'You do not have permission to save this experience. Save a copy with "File > Save as" instead.',
          });
        }

        // If an id is provided then we are updating an existing experience
        await ctx.db
          .update(experiences)
          .set({ name, songId, data, status, version })
          .where(eq(experiences.id, id))
          .execute();
        return id;
      }

      // If no id is provided then we are inserting a new experience
      const [updatedExperience] = await ctx.db
        .insert(experiences)
        .values({ name, songId, data, status, version })
        .onConflictDoNothing({ target: [experiences.name] })
        .returning({ id: experiences.id })
        .execute();

      if (!updatedExperience) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Could not save experience because someone has already taken that name. Experience names must be globally unique. Please try a different name.",
        });
      }

      await ctx.db
        .insert(usersToExperiences)
        .values({
          userId: ctx.user.id,
          experienceId: updatedExperience.id,
        })
        .onConflictDoNothing()
        .execute();

      return updatedExperience.id;
    }),

  getExperience: databaseProcedure
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

  getExperienceById: databaseProcedure
    .input(
      z.object({
        experienceId: z.number(),
        usingLocalData: z.boolean(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.experiences
        .findFirst({
          with: { song: true },
          where: eq(experiences.id, input.experienceId),
        })
        .execute();
    }),
});
