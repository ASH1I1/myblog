/**
 * 后台编辑器的**字段描述表** —— `/admin/content/*` 六个页面的表单全由它生成。
 *
 * 加一个可编辑字段＝在这里加一行，不用碰任何组件；字段的校验规则另在
 * `schema.ts` 的 `*FormSchema` 里（这里只管「长什么样」，那里管「合不合法」）。
 *
 * 这个文件是**纯数据 + 纯函数**（不 import zod、不碰 fs），所以客户端组件可以直接用。
 * 路径（`path`）用点号表示，指向 `SiteContent` 里的一段：如 `favorites.years`、
 * `about.skills`；列表项的字段名相对于该项，如 `favorites.years.0.items.2.name` 里的 `name`。
 */

export const SECTION_IDS = [
  "favorites",
  "projects",
  "games",
  "music",
  "books",
  "about",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export function isSectionId(value: string): value is SectionId {
  return (SECTION_IDS as readonly string[]).includes(value);
}

/* ---------------------------- 字段与区块 ---------------------------- */

export type FieldSpec =
  | { kind: "text"; name: string; label: string; placeholder?: string; hint?: string }
  | { kind: "textarea"; name: string; label: string; rows?: number; hint?: string }
  | { kind: "number"; name: string; label: string; hint?: string }
  | { kind: "emoji"; name: string; label: string; hint?: string }
  | { kind: "image"; name: string; label: string; hint?: string }
  | { kind: "select"; name: string; label: string; options: Array<{ value: string; label: string }>; hint?: string }
  | { kind: "stringList"; name: string; label: string; hint?: string };

/** 列表里每条长什么样；`nested` 用来表达「列表里还嵌一层列表」（最爱：年份 → 条目） */
export type ListItemSpec = {
  fields: FieldSpec[];
  /** 用哪个字段当这条的标题（列表头显示）+ 新增时的空白项 */
  titleField: string;
  empty: Record<string, unknown>;
  nested?: {
    name: string;
    /** 嵌的那层子列表在页面上的小标题 */
    title: string;
    titleField: string;
    fields: FieldSpec[];
    empty: Record<string, unknown>;
    addLabel: string;
  };
};

export type BlockSpec =
  | { kind: "object"; path: string; title: string; description?: string; fields: FieldSpec[] }
  | {
      kind: "list";
      path: string;
      title: string;
      description?: string;
      addLabel: string;
      item: ListItemSpec;
    };

export type SectionSpec = {
  id: SectionId;
  title: string;
  description: string;
  blocks: BlockSpec[];
};

/* ---------------------------- 复用的字段组 ---------------------------- */

const FAVORITE_ITEM_FIELDS: FieldSpec[] = [
  { kind: "text", name: "name", label: "条目名" },
  { kind: "emoji", name: "emoji", label: "Emoji" },
  { kind: "text", name: "description", label: "一句话描述" },
  { kind: "text", name: "url", label: "链接", hint: "站内写 /posts/1；外链写完整 URL（新窗口打开）" },
  { kind: "image", name: "image", label: "配图", hint: "public/ 下的路径，如 /favorites/xxx.jpg；留空则用该年份的默认配图" },
  {
    kind: "select",
    name: "imageFit",
    label: "配图取法",
    options: [
      { value: "", label: "（默认）裁切铺满" },
      { value: "cover", label: "cover：裁切铺满" },
      { value: "contain", label: "contain：完整显示（方图用）" },
    ],
  },
  { kind: "text", name: "badge", label: "角标", hint: "名字后那枚小标签，留空就没有" },
  { kind: "textarea", name: "note", label: "短文", rows: 3, hint: "预览面板的摘要会优先用它" },
];

/* ---------------------------- 六个板块 ---------------------------- */

export const SECTION_SPECS: Record<SectionId, SectionSpec> = {
  favorites: {
    id: "favorites",
    title: "最爱",
    description:
      "按年份分组的收藏。年份从早到晚维护，页面自动倒排（新的在最前）；组内按这里的顺序显示。",
    blocks: [
      { kind: "object", path: "favorites", title: "引导语", fields: [{ kind: "textarea", name: "intro", label: "内容区顶部的引导语", rows: 2 }] },
      {
        kind: "list",
        path: "favorites.years",
        title: "年份分组",
        addLabel: "新增年份",
        item: {
          titleField: "year",
          fields: [
            { kind: "number", name: "year", label: "年份" },
            { kind: "image", name: "cover", label: "该年默认配图", hint: "条目自己没写配图时用它" },
          ],
          empty: { year: new Date().getFullYear(), items: [] },
          nested: {
            name: "items",
            title: "条目",
            titleField: "name",
            fields: FAVORITE_ITEM_FIELDS,
            empty: { name: "", emoji: "", description: "", url: "" },
            addLabel: "新增条目",
          },
        },
      },
    ],
  },

  projects: {
    id: "projects",
    title: "项目",
    description: "项目卡片与技术栈表。卡片顺序即这里的顺序。",
    blocks: [
      {
        kind: "list",
        path: "projects.items",
        title: "项目",
        addLabel: "新增项目",
        item: {
          titleField: "name",
          fields: [
            { kind: "text", name: "name", label: "项目名" },
            { kind: "emoji", name: "emoji", label: "Emoji" },
            { kind: "textarea", name: "description", label: "一句话介绍", rows: 2 },
            { kind: "stringList", name: "tags", label: "技术标签", hint: "每行一个，如 Next.js" },
            { kind: "text", name: "url", label: "链接", hint: "没有就填 #" },
          ],
          empty: { name: "", emoji: "", description: "", tags: [], url: "#" },
        },
      },
      {
        kind: "list",
        path: "projects.skills",
        title: "技术栈",
        addLabel: "新增技术组",
        item: {
          titleField: "title",
          fields: [
            { kind: "text", name: "title", label: "分组名", hint: "如「语言」「前端」" },
            { kind: "stringList", name: "skills", label: "技能", hint: "每行一个" },
          ],
          empty: { title: "", skills: [] },
        },
      },
    ],
  },

  games: {
    id: "games",
    title: "游戏",
    description:
      "ALL-TIME 榜单：顺序即名次（页面显示 01…）。封面为窄横幅，取景位置控制露出原图的哪一条横带。",
    blocks: [
      {
        kind: "list",
        path: "games",
        title: "榜单",
        addLabel: "新增游戏",
        item: {
          titleField: "name",
          fields: [
            { kind: "text", name: "name", label: "游戏名" },
            { kind: "image", name: "cover", label: "封面", hint: "public/ 下的路径，如 /games/detroit.jpg" },
            {
              kind: "text",
              name: "imagePosition",
              label: "取景位置",
              hint: "CSS object-position，如 50% 44%。百分比越小＝取景越靠上；留空＝正中",
            },
          ],
          empty: { name: "", cover: "", imagePosition: "50% 50%" },
        },
      },
    ],
  },

  music: {
    id: "music",
    title: "音乐",
    description: "三块：去年在循环的那张、常听艺人（左栏）、最近循环（右栏）。",
    blocks: [
      {
        kind: "object",
        path: "music",
        title: "ON REPEAT · 去年",
        description: "页面顶部那一大条",
        fields: [
          { kind: "text", name: "yearly.title", label: "曲名 / 专辑名" },
          { kind: "text", name: "yearly.artist", label: "艺人" },
          { kind: "text", name: "yearly.note", label: "备注", hint: "如「去年循环了 187 次」" },
        ],
      },
      {
        kind: "list",
        path: "music.artists",
        title: "常听艺人（ARTISTS）",
        addLabel: "新增艺人",
        item: {
          titleField: "name",
          fields: [
            { kind: "text", name: "name", label: "艺人名" },
            { kind: "text", name: "note", label: "备注" },
          ],
          empty: { name: "", note: "" },
        },
      },
      {
        kind: "list",
        path: "music.onRepeat",
        title: "最近循环（LATELY）",
        addLabel: "新增曲目",
        item: {
          titleField: "title",
          fields: [
            { kind: "text", name: "title", label: "曲名" },
            { kind: "text", name: "artist", label: "艺人" },
          ],
          empty: { title: "", artist: "" },
        },
      },
    ],
  },

  books: {
    id: "books",
    title: "读过",
    description: "书单，一行一本。状态徽标、短评、评分都是「填了才显示」。",
    blocks: [
      {
        kind: "list",
        path: "books",
        title: "书单",
        addLabel: "新增一本书",
        item: {
          titleField: "title",
          fields: [
            { kind: "text", name: "title", label: "书名" },
            { kind: "text", name: "author", label: "作者" },
            {
              kind: "select",
              name: "status",
              label: "阅读状态",
              options: [
                { value: "", label: "（不标）" },
                { value: "在读", label: "在读" },
                { value: "已读", label: "已读" },
                { value: "想读", label: "想读" },
              ],
            },
            { kind: "textarea", name: "note", label: "短评", rows: 2, hint: "留空就不渲染那一段" },
            { kind: "text", name: "rating", label: "评分", hint: "如 ★★★★☆，留空则右侧不显示" },
          ],
          empty: { title: "", author: "" },
        },
      },
    ],
  },

  about: {
    id: "about",
    title: "关于我",
    description:
      "简介 / 技能经历 / 联系方式。名片上的名字、标语、头像在站点配置里（site-config.ts），不在这一页。",
    blocks: [
      {
        kind: "object",
        path: "about",
        title: "个人简介",
        description: "支持 Markdown",
        fields: [{ kind: "textarea", name: "bio", label: "正文", rows: 8 }],
      },
      {
        kind: "list",
        path: "about.skills",
        title: "技能 / 经历",
        addLabel: "新增一条",
        item: {
          titleField: "title",
          fields: [
            { kind: "text", name: "period", label: "时间", hint: "如「现在」「2023」" },
            { kind: "text", name: "title", label: "标题" },
            { kind: "text", name: "description", label: "说明", hint: "留空就不显示" },
          ],
          empty: { period: "", title: "", description: "" },
        },
      },
      {
        kind: "list",
        path: "about.contacts",
        title: "联系方式",
        addLabel: "新增联系方式",
        item: {
          titleField: "label",
          fields: [
            { kind: "text", name: "label", label: "名称", hint: "如 GitHub、邮箱" },
            { kind: "text", name: "href", label: "链接", hint: "mailto:… 或 https://…（同时决定页脚那两个链接）" },
          ],
          empty: { label: "", href: "" },
        },
      },
    ],
  },
};

/* ---------------------------- 路径读写 ---------------------------- */

type AnyRecord = Record<string, unknown>;

/** 按点号路径取值（列表用数字下标，如 `favorites.years.0.items`） */
export function getByPath(root: unknown, path: string): unknown {
  let cur: unknown = root;
  for (const key of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as AnyRecord)[key];
  }
  return cur;
}

/**
 * 按点号路径就地写值。**不可变更新**：沿途每一层都换新对象/数组，返回新的根——
 * 这样 React 的 state 比较才认得出变化（草稿模型靠它）。
 */
export function setByPath<T>(root: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const clone = (node: unknown): unknown => {
    if (Array.isArray(node)) return [...node];
    if (node !== null && typeof node === "object") return { ...(node as AnyRecord) };
    return node;
  };
  const next = clone(root) as AnyRecord;
  let cur = next;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    cur[key] = clone(cur[key]);
    cur = cur[key] as AnyRecord;
  }
  cur[keys[keys.length - 1]] = value;
  return next as T;
}
