import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import fs from "fs";

export const localDatabaseNotFoundMessage =
  "Local database file not found. Run `yarn db:download` to create it.";

export let localDB: ReturnType<typeof drizzle> | null = null;

export const connectToLocalDatabase = () => {
  if (process.env.NODE_ENV === "production") return false;

  if (!fs.existsSync("./local.db")) {
    console.error(localDatabaseNotFoundMessage);
    return false;
  }

  const client = createClient({
    url: "file:./local.db",
  });

  localDB = drizzle(client, { schema });

  return true;
};

connectToLocalDatabase();
