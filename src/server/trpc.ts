import { getProdDatabase } from "@/src/db/prod";
import { getLocalDatabase } from "@/src/db/local";
import { TRPCClientError } from "@trpc/client";
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { users } from "@/src/db/schema";

const t = initTRPC.create();

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

export const databaseProcedure = publicProcedure
  .input(
    z.object({
      usingLocalData: z.boolean(),
    })
  )
  .use(async ({ input, next }) => {
    const { usingLocalData } = input;

    if (usingLocalData && process.env.NODE_ENV === "production") {
      throw new TRPCClientError("Local database cannot be used in production");
    }

    try {
      return next({
        ctx: {
          db: usingLocalData ? getLocalDatabase() : getProdDatabase(),
        },
      });
    } catch (e) {
      console.error(e);
      throw new TRPCClientError("Database connection error, check log");
    }
  });

// TODO: later on implement this as authedProcedure
export const userProcedure = databaseProcedure
  .input(
    z.object({
      username: z.string(),
    })
  )
  .use(async ({ ctx, input, next }) => {
    const { username } = input;

    const user = await ctx.db.query.users
      .findFirst({ where: eq(users.username, username) })
      .execute();

    if (!user)
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    return next({ ctx: { ...ctx, user } });
  });
