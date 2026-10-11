import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/lib/db/schema";

/** 供 scripts/* 使用的数据库连接（独立于 src/lib/db/client.ts，避免引入 server-only）。 */
export function openDb(): {
  sqlite: Database.Database;
  db: BetterSQLite3Database<typeof schema>;
} {
  const file = path.resolve(
    process.cwd(),
    process.env.DATABASE_PATH ?? "./data/blog.db",
  );
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");

  return { sqlite, db: drizzle(sqlite, { schema }) };
}
