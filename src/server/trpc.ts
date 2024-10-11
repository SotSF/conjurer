import { cloudDB } from "@/src/db/cloud";
import { localDB } from "@/src/db/local";
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// TODO: later on call this authedProcedure
export const withDatabaseProcedure = t.procedure
  .input(
    z.object({
      usingLocalDatabase: z.boolean(),
    })
  )
  .use(async (opts) =>
    opts.next({
      ctx: {
        db: opts.input.usingLocalDatabase ? localDB : cloudDB,
      },
    })
  );
