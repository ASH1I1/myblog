import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { openDb } from "./db";

const { db } = openDb();
migrate(db, { migrationsFolder: "./drizzle" });
console.log("✓ 数据库迁移完成（drizzle/ 下所有迁移已应用）");
