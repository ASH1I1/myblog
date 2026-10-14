import { z } from "zod";

/**
 * `data/content.json` 的校验层。
 *
 * **读侧宽松、写侧严格**，两套共用一个底：
 * - 不带 `Form` 后缀的 schema 供**读取**用：只约束类型，允许空串（空串只会让那一处
 *   渲染成空，不会炸页面）。手改过的 JSON 只要结构对就能读进来。
 * - `*FormSchema` 供**后台表单**用：在底 schema 上 `extend` 几个必填规则 + 中文报错，
 *   写进文件前把关（也是 fieldErrors 的来源）。
 *
 * 可选项统一用 `optStr` / `optEnum` 归一：JSON 里可能缺键、也可能是 `null`（手改过），
 * 两种都归一成 `undefined`，这样落到应用侧就是 `image?: string` 这种干净的可选类型，
 * 组件里的「有才渲染」分支一行都不用改。
 */

/* ---------------------------- 小工具 ---------------------------- */

/** 可选字符串：缺键 / null 都归一成 undefined */
const optStr = z
  .string()
  .nullish()
  .transform((v) => v ?? undefined);
/** 字符串数组：缺键 / null → 空数组（比 undefined 好用，map 不用判空） */
const strList = z
  .array(z.string())
  .nullish()
  .transform((v) => v ?? []);
// 可选枚举没有做成泛型 helper：泛型会把字面量联合收宽成 string，
// 落到 SiteContent 上就类型不匹配了——两处直接内联写，字面量类型才保得住。

/* ---------------------------- 最爱 ---------------------------- */

export const favoriteLinkSchema = z.object({
  name: z.string(),
  description: z.string(),
  url: z.string(),
  emoji: z.string(),
  image: optStr,
  imageFit: z
    .enum(["cover", "contain"])
    .nullish()
    .transform((v) => v ?? undefined),
  badge: optStr,
  note: optStr,
});

export const favoriteYearSchema = z.object({
  year: z.number(),
  items: z.array(favoriteLinkSchema),
  cover: optStr,
});

export const favoritesFormSchema = z.object({
  intro: z.string(),
  years: z.array(favoriteYearSchema),
});

/** 年份表单（新增 / 编辑一年的分组本身） */
export const favoriteYearFormSchema = z.object({
  year: z.coerce.number().int("年份要是整数").min(1000, "年份看起来不对").max(9999, "年份看起来不对"),
  cover: optStr,
});

export const favoriteLinkFormSchema = favoriteLinkSchema.extend({
  name: z.string().trim().min(1, "条目名不能为空"),
  description: z.string().trim(),
  url: z.string().trim().min(1, "链接不能为空（站内写 /posts/1，外链写完整 URL）"),
});

/* ---------------------------- 项目 ---------------------------- */

export const projectSchema = z.object({
  name: z.string(),
  emoji: z.string(),
  description: z.string(),
  tags: strList,
  url: z.string(),
});

export const skillGroupSchema = z.object({
  title: z.string(),
  skills: strList,
});

export const projectFormSchema = projectSchema.extend({
  name: z.string().trim().min(1, "项目名不能为空"),
  description: z.string().trim(),
  url: z.string().trim().min(1, "链接不能为空（没有就填 #）"),
});

export const skillGroupFormSchema = skillGroupSchema.extend({
  title: z.string().trim().min(1, "分组名不能为空"),
});

/* ---------------------------- 游戏 ---------------------------- */

export const gameEntrySchema = z.object({
  name: z.string(),
  cover: optStr,
  imagePosition: optStr,
});

export const gameEntryFormSchema = gameEntrySchema.extend({
  name: z.string().trim().min(1, "游戏名不能为空"),
});

/* ---------------------------- 音乐 ---------------------------- */

export const artistSchema = z.object({ name: z.string(), note: z.string() });
export const trackSchema = z.object({ title: z.string(), artist: z.string() });
export const musicYearlySchema = z.object({
  title: z.string(),
  artist: z.string(),
  note: z.string(),
});

export const musicSchema = z.object({
  yearly: musicYearlySchema,
  artists: z.array(artistSchema),
  onRepeat: z.array(trackSchema),
});

export const artistFormSchema = artistSchema.extend({
  name: z.string().trim().min(1, "艺人名不能为空"),
  note: z.string().trim(),
});

export const trackFormSchema = trackSchema.extend({
  title: z.string().trim().min(1, "曲名不能为空"),
  artist: z.string().trim(),
});

export const musicYearlyFormSchema = musicYearlySchema.extend({
  title: z.string().trim().min(1, "曲名不能为空"),
  artist: z.string().trim(),
});

/* ---------------------------- 读过 ---------------------------- */

export const bookSchema = z.object({
  title: z.string(),
  author: z.string(),
  status: z
    .enum(["已读", "在读", "想读"])
    .nullish()
    .transform((v) => v ?? undefined),
  note: optStr,
  rating: optStr,
});

export const bookFormSchema = bookSchema.extend({
  title: z.string().trim().min(1, "书名不能为空"),
  author: z.string().trim().min(1, "作者不能为空"),
});

/* ---------------------------- 关于我 ---------------------------- */

export const aboutSkillSchema = z.object({
  period: z.string(),
  title: z.string(),
  description: optStr,
});

export const contactSchema = z.object({ label: z.string(), href: z.string() });

export const aboutSkillFormSchema = aboutSkillSchema.extend({
  period: z.string().trim(),
  title: z.string().trim().min(1, "标题不能为空"),
});

export const contactFormSchema = contactSchema.extend({
  label: z.string().trim().min(1, "名称不能为空"),
  href: z.string().trim().min(1, "链接不能为空"),
});

export const aboutFormSchema = z.object({
  bio: z.string(),
  skills: z.array(aboutSkillSchema),
  contacts: z.array(contactSchema),
});

/* ---------------------------- 整份内容 ---------------------------- */

export const contentSchema = z.object({
  version: z.number().int().default(1),
  favorites: favoritesFormSchema,
  projects: z.object({
    items: z.array(projectSchema),
    skills: z.array(skillGroupSchema),
  }),
  games: z.array(gameEntrySchema),
  music: musicSchema,
  books: z.array(bookSchema),
  about: aboutFormSchema,
});
