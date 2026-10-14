/**
 * 一次性工具：把 `src/lib/content/defaults.ts` 的默认内容导出成 `data/content.json`。
 * 用途——首次建立内容文件，或者想「把内容重置回默认」时手动跑一次：
 *   npx tsx scripts/export-content.ts
 * （日常内容以 data/content.json 为准，后台保存不会碰 defaults。）
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { defaultContent } from "../src/lib/content/defaults";

const file = path.join(process.cwd(), "data", "content.json");
mkdirSync(path.dirname(file), { recursive: true });
writeFileSync(file, `${JSON.stringify(defaultContent, null, 2)}\n`, "utf8");
console.log(`已写出 ${file}`);
