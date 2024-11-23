import { router, databaseProcedure, userProcedure } from "@/src/server/trpc";
import { z } from "zod";
import { experiences, users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { EXPERIENCE_STATUSES } from "@/src/types/Experience";
import { TRPCError } from "@trpc/server";

export const experienceRouter = router({
  listExperiencesForUser: databaseProcedure
    .input(
      z.object({
        username: z.string(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.db
        .select({
          id: experiences.id,
          name: experiences.name,
        })
        .from(experiences)
        .leftJoin(users, eq(experiences.userId, users.id))
        .where(eq(users.username, input.username))
        .all(),
    ),

  listExperiences: databaseProcedure
    .input(
      z.object({
        username: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      let whereClause = {};
      if (input.username) {
        const user = await ctx.db.query.users
          .findFirst({ where: eq(users.username, input.username) })
          .execute();
        if (!user) return [];
        whereClause = { where: eq(experiences.userId, user.id) };
      }

      return await ctx.db.query.experiences
        .findMany({
          columns: {
            id: true,
            name: true,
            status: true,
            version: true,
            thumbnailURL: true,
          },
          with: {
            user: { columns: { id: true, username: true } },
            song: true,
          },
          ...whereClause,
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, song, data, status, version } = input;
      const { id: songId } = song;

      if (id) {
        // Check if the user has permission to save this experience
        const userToExperience = await ctx.db.query.experiences
          .findFirst({
            where: eq(experiences.userId, ctx.user.id),
          })
          .execute();

        if (userToExperience?.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              'You do not have permission to edit this experience. Save a copy with "File > Save as" instead.',
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
        .values({ name, songId, data, status, version, userId: ctx.user.id })
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

      return updatedExperience.id;
    }),

  getExperience: databaseProcedure
    .input(
      z.object({
        experienceName: z.string(),
        usingLocalData: z.boolean(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.db.query.experiences
        .findFirst({
          with: { user: true, song: true },
          where: eq(experiences.name, input.experienceName),
        })
        .execute(),
    ),

  getExperienceById: databaseProcedure
    .input(
      z.object({
        experienceId: z.number(),
        usingLocalData: z.boolean(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.db.query.experiences
        .findFirst({
          with: { user: true, song: true },
          where: eq(experiences.id, input.experienceId),
        })
        .execute(),
    ),
});
