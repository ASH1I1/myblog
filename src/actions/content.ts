"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { isSectionId } from "@/lib/content/editor";
import { contentSchema } from "@/lib/content/schema";
import { CONTENT_TAG, updateContent } from "@/lib/content/store";

/**
 * 展示内容的保存动作 —— 后台 `/admin/content/*` 六个板块共用这一个。
 *
 * **一次保存一整节**（表单把该节的完整 JSON 放在 `payload` 里）。为什么不是「加一条就存一条」：
 * 新加的条目一开始必然是空的，而 schema 要求必填字段非空——逐条即存的话，那些空条目会
 * 立刻出现在公网首页上（要么就存不进去）。整节草稿 + 一次保存的模型下，本地怎么增删移
 * 都不影响线上，点保存时整节过校验才落盘：**文件永远是合法的、首页永远是完整的**。
 *
 * 缓存失效走 `updateTag(CONTENT_TAG)`（read-your-writes：下一次读取阻塞等新数据）。
 * 注意 `updateTag` **只能在 Server Action 里调**，这也是这一层选 Action 而不是 Route Handler
 * 的原因——顺带写操作后前端拿到的就是重新渲染过的 RSC，不用手动刷新。
 */

export type ContentFormState = {
  ok: boolean;
  formError: string | null;
  /** 键＝相对该节的字段路径（如 `years.0.items.2.name`），值是中文提示 */
  fieldErrors: Record<string, string>;
  savedAt: string | null;
};

export async function saveContentSectionAction(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  await requireAdmin("/admin/content");

  const section = String(formData.get("section") ?? "");
  const payload = String(formData.get("payload") ?? "");

  if (!isSectionId(section)) {
    return { ok: false, formError: "未知板块，请刷新页面重试", fieldErrors: {}, savedAt: null };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(payload);
  } catch {
    return {
      ok: false,
      formError: "提交的数据不是合法 JSON（页面可能被改坏了，刷新重试）",
      fieldErrors: {},
      savedAt: null,
    };
  }

  // 该节的严格校验：规则与读取侧同一套 schema，只是这里会把错误逐字段报回去
  const sectionSchema = contentSchema.shape[section];
  const parsed = sectionSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      formError: "有字段没填对，下面标红的地方改一下再保存",
      fieldErrors,
      savedAt: null,
    };
  }

  try {
    await updateContent((draft) => {
      // 六个板块与 SiteContent 的顶层键一一对应，赋值即可
      (draft as unknown as Record<string, unknown>)[section] = parsed.data;
    });
  } catch (err) {
    return {
      ok: false,
      formError:
        `写入 data/content.json 失败：${(err as Error).message}` +
        "（若是只读环境，请确认 data/ 挂载了可写卷）",
      fieldErrors: {},
      savedAt: null,
    };
  }

  // 关键的一步：让首页那层 `use cache` 立刻过期（下次请求等新数据）
  updateTag(CONTENT_TAG);

  return {
    ok: true,
    formError: null,
    fieldErrors: {},
    savedAt: new Date().toISOString(),
  };
}
