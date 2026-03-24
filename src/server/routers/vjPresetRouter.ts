import { router, userProcedure } from "@/src/server/trpc";
import { vjPresets } from "@/src/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const vjPresetRouter = router({
  list: userProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.vjPresets
      .findMany({
        where: eq(vjPresets.userId, ctx.user.id),
        columns: {
          id: true,
          name: true,
          serializedBlock: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [desc(vjPresets.updatedAt)],
      })
      .execute();

    return rows;
  }),

  create: userProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(200),
        serializedBlock: z.any(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(vjPresets)
        .values({
          name: input.name,
          userId: ctx.user.id,
          serializedBlock: input.serializedBlock,
        })
        .returning({
          id: vjPresets.id,
          name: vjPresets.name,
          createdAt: vjPresets.createdAt,
          updatedAt: vjPresets.updatedAt,
        })
        .execute();

      if (!row)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create preset",
        });

      return row;
    }),

  delete: userProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(vjPresets)
        .where(
          and(eq(vjPresets.id, input.id), eq(vjPresets.userId, ctx.user.id)),
        )
        .returning({ id: vjPresets.id })
        .execute();

      if (deleted.length === 0)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Preset not found",
        });
    }),
});
