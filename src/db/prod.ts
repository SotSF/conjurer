import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

let prodDB: ReturnType<typeof drizzle> | null = null;

export const getProdDatabase = () => {
  if (prodDB) return prodDB;

  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error(
      "TURSO_DATABASE_URL or TURSO_AUTH_TOKEN is not defined, can't connect to prod database"
    );
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  prodDB = drizzle(client, { schema });

  return prodDB;
};

getProdDatabase();
