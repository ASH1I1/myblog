import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const DEFAULT_DB_PATH = "./data/blog.db";

function resolveDbPath(): string {
  // 数据库文件在运行时创建，不应被打进构建产物 —— 显式退出 Turbopack 文件追踪
  return path.resolve(
    /* turbopackIgnore: true */
    process.cwd(),
    process.env.DATABASE_PATH ?? DEFAULT_DB_PATH,
  );
}

function createDatabase(): Database.Database {
  const file = resolveDbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");

  // 启动时自动应用未执行的迁移（幂等，drizzle 自带迁移记录表），
  // 保证 dev / build / 部署启动后数据库结构就绪，无需手工执行
  migrate(drizzle(sqlite), {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });

  return sqlite;
}

// 开发模式 HMR 下复用连接，避免重复打开数据库文件
const globalForDb = globalThis as unknown as { __sqlite?: Database.Database };

export const sqlite: Database.Database =
  globalForDb.__sqlite ?? (globalForDb.__sqlite = createDatabase());

export const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, { schema });
