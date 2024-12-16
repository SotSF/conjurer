import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type ConjurerDatabase = ReturnType<typeof drizzle<typeof schema>>;
