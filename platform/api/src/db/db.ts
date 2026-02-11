import BetterSqlite3 from "better-sqlite3";
import type { DB } from "./types";
import { ensureSchema } from "./schema";

/**
 * Canonical DB opener:
 * - DB is a TYPE ONLY (no runtime symbol).
 * - Runtime value is BetterSqlite3.Database.
 * - Backwards compatible signature: openDb("file.db") OR openDb({filename:"file.db"})
 */
export function openDb(arg?: string | { filename?: string }): DB {
  const filename =
    typeof arg === "string" ? arg :
    (arg?.filename ?? "icontrol.db");

  const db = new BetterSqlite3(filename) as unknown as DB;
  ensureSchema(db);
  return db;
}
