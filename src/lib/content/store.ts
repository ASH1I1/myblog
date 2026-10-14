import "server-only";

import { copyFile, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { defaultContent } from "./defaults";
import { contentSchema } from "./schema";
import type { SiteContent } from "./types";

/**
 * 展示内容的读写 —— `data/content.json` 是**单一真源**，前台的六个展示章节都从这里读，
 * 后台（/admin/content/*）只通过这里写。
 *
 * 为什么读要包 `'use cache'`：首页是 Cache Components 的静态壳，展示内容会被烘进预渲染的
 * HTML。用模块 import / `fs.readFileSync` 读这份 JSON 属于 Next 文档里说的 "predictable"
 * 读法——构建时就固化，后台改完永远不生效。放进 `'use cache' + cacheTag('content')` 里，
 * 后台保存时 `updateTag("content")` 一调，下次请求就会阻塞等新数据（read-your-own-writes），
 * 这就是「保存后首页立刻变」的实现方式。
 *
 * **两个读函数是刻意分工的**：
 * - `getContent()`：给**渲染**用（前台各章节），带缓存。
 * - `readContentFile()`：给**写操作与后台编辑页**用，裸读、不缓存——写操作若从缓存读，
 *   会把「手改过但缓存还没失效」的旧内容整篇写回去，等于静默回滚别人的改动。
 *
 * `use cache` 作用域内不能读 cookies/headers —— 鉴权一律在调用方（Server Action）里
 * 先用 `requireAdmin()` 做掉，这里只认文件。
 */

/** 缓存标签：后台每次写入后都要 `updateTag(CONTENT_TAG)` */
export const CONTENT_TAG = "content";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "content.json");

/* ---------------------------- 读 ---------------------------- */

export type ReadResult = {
  content: SiteContent;
  /** 读取过程中的异常说明（空数组＝文件干净）。后台用来显示黄条，前台忽略。 */
  issues: string[];
};

/**
 * 裸读（不缓存）：解析 + 校验 + 兜底。**给写操作与后台编辑页用**。
 *
 * 兜底策略是「**逐节**回落」：整份能过就整份用；某节坏了只把那一节退回默认，
 * 其余照旧——手滑改坏一个字段不至于把整套内容打回默认（那样最吓人）。
 * 文件缺失（全新克隆）或整份 JSON 语法错才整份回落。
 */
export async function readContentFile(): Promise<ReadResult> {
  const issues: string[] = [];

  let raw: string;
  try {
    raw = await readFile(FILE, "utf8");
  } catch (err) {
    // ENOENT＝还没建过这个文件，属正常情况（首次保存时才会写出）
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      issues.push(`读取 ${FILE} 失败：${(err as Error).message}`);
    }
    return { content: defaultContent, issues };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    issues.push(`data/content.json 不是合法 JSON：${(err as Error).message}`);
    return { content: defaultContent, issues };
  }

  const whole = contentSchema.safeParse(json);
  if (whole.success) return { content: whole.data, issues };

  // 整份不过 → 逐节重试，坏的节退回默认值
  issues.push("data/content.json 有几处不符合 schema，已按默认值兜底：");
  const fallback: SiteContent = structuredClone(defaultContent);
  const source = (json ?? {}) as Record<string, unknown>;
  for (const key of Object.keys(defaultContent) as Array<keyof SiteContent>) {
    const section = contentSchema.shape[key].safeParse(source[key]);
    if (section.success) {
      // @ts-expect-error 逐键赋值的类型在循环里收窄不了，但键都来自 SiteContent 本身
      fallback[key] = section.data;
    } else {
      const path0 = section.error.issues[0]?.path.join(".") ?? "";
      issues.push(`  · ${String(key)}${path0 ? `.${path0}` : ""}：${section.error.issues[0]?.message ?? "不合法"}`);
    }
  }
  return { content: fallback, issues };
}

/**
 * 读整份内容（**带缓存，给渲染用**）。缓存的失效只有一条路：后台保存后
 * `updateTag(CONTENT_TAG)`。开发期直接手改 `data/content.json` 不会让缓存失效
 * （`use cache` 的 key 里含模块 HMR 哈希，改文件不动模块）——重启 dev，或走一次后台保存。
 */
export async function getContent(): Promise<SiteContent> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_TAG);
  const { content } = await readContentFile();
  return content;
}

/* ---------------------------- 写 ---------------------------- */

/**
 * 把整份内容写回文件。三步：**先整份校验**（不通过就抛错、不落盘）→ 备份旧文件到
 * `content.json.bak` → 写临时文件再 `rename` 覆盖（同目录 rename 是原子替换，
 * 中途断电也不会留下半截 JSON）。
 *
 * fs 层面的失败（只读卷 `EROFS`、权限 `EACCES`）原样抛出，由调用方转成给用户看的提示。
 */
export async function writeContent(next: SiteContent): Promise<void> {
  const validated = contentSchema.parse(next);
  const text = `${JSON.stringify(validated, null, 2)}\n`;

  await mkdir(DATA_DIR, { recursive: true });
  try {
    await copyFile(FILE, `${FILE}.bak`);
  } catch {
    // 首次写入时没有旧文件，正常
  }
  const tmp = `${FILE}.tmp`;
  await writeFile(tmp, text, "utf8");
  try {
    await rename(tmp, FILE);
  } catch (err) {
    await unlink(tmp).catch(() => {});
    throw err;
  }
}

/**
 * 读-改-写一条龙：给一个「就地改」的回调，改完自动校验 + 原子落盘。
 * **读的是裸文件而不是缓存**（见文件头注释：避免把别人手改的内容静默覆盖）。
 *
 * **不做并发保护**（没有乐观锁）：单人后台、低频操作，两个人同时保存的窗口极小；
 * 真要多人协作时再加版本号。写入前整份 schema 校验，手滑改出坏结构也落不了盘。
 *
 * ⚠️ 调用方（Server Action）必须自己先 `requireAdmin()`，并在写完后 `updateTag(CONTENT_TAG)`。
 */
export async function updateContent(
  mutate: (draft: SiteContent) => void,
): Promise<SiteContent> {
  const { content } = await readContentFile();
  const draft = structuredClone(content);
  mutate(draft);
  await writeContent(draft);
  return draft;
}
