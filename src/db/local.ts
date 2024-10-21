import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import fs from "fs";

let localDB: ReturnType<typeof drizzle> | null = null;

export const getLocalDatabase = () => {
  if (localDB) return localDB;

  if (!fs.existsSync("./local.db")) {
    throw new Error(
      // TODO: setup local database automatically
      "Local database file not found. Run `yarn db:local:setup` to create it."
    );
  }

  const client = createClient({
    url: "file:./local.db",
  });

  localDB = drizzle(client, { schema });

  return localDB;
};

getLocalDatabase();
