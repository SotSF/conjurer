import { cloudDB } from "@/src/db/cloud";
import {
  connectToLocalDatabase,
  localDatabaseNotFoundMessage,
  localDB,
} from "@/src/db/local";
import { TRPCClientError } from "@trpc/client";
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// TODO: later on call this authedProcedure
export const withDatabaseProcedure = publicProcedure
  .input(
    z.object({
      usingLocalDatabase: z.boolean(),
    })
  )
  .use(async (opts) => {
    const { usingLocalDatabase } = opts.input;

    if (!usingLocalDatabase) {
      return opts.next({ ctx: { db: cloudDB } });
    }

    if (process.env.NODE_ENV === "production") {
      throw new TRPCClientError("Cannot use local database in production");
    }

    if (!localDB && !connectToLocalDatabase()) {
      throw new TRPCClientError(localDatabaseNotFoundMessage);
    }

    return opts.next({ ctx: { db: localDB } });
  });
