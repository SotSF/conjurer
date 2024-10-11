import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import fs from "fs";

// Check if local database file exists
if (!fs.existsSync("./local.db")) {
  // TODO:
  console.log("Local database file does not exist. Creating it now...");
  fs.writeFileSync("./local.db", "");
}

const client = createClient({
  url: "file:./local.db",
});

export const localDB = drizzle(client, { schema });
