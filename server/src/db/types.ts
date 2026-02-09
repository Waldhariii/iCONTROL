import BetterSqlite3 from "better-sqlite3";

/**
 * Canonical DB handle type for better-sqlite3.
 * Use this everywhere instead of `Database` namespace/type.
 */
export type DB = ReturnType<typeof BetterSqlite3>;
