import type { ChapterPreviewList, SiteContent } from "./types";

/**
 * 一次算齐五个展示板块的小预览，键＝章节 id。给首页顶部那行目录卡片用
 * （`section-index.tsx` 是客户端组件，拿不到文件，只能由服务端把结果传下去）。
 * 没有数据的板块对应 `undefined`——面板那边显示「暂无内容」。
 */
export function chapterLists(
  content: SiteContent,
): Record<string, ChapterPreviewList | undefined> {
  return Object.fromEntries(
    ["favorites", "projects", "game", "music", "read"].map((id) => [
      id,
      chapterList(id, content),
    ]),
  );
}

/**
 * 按章节 id 取「本章内容小预览」的行数据——五个展示章的悬浮面板里那段列表。
 *
 * 全部**从内容数据现算**，不另抄一份：`data/content.json` 一改，这里自动跟着变；
 * 数据为空就返回空 rows，面板那边显示「暂无内容」。「最爱」按年份分组（新的在前），
 * 右栏放年份——和章节里按年份排布的读法一致。
 *
 * **纯函数、无副作用、不读文件**：内容是参数传进来的。这点很重要——消费它的
 * `preview-provider.tsx` / `section-index.tsx` 都是客户端组件，不能在浏览器里读
 * JSON 文件，所以由服务端父组件先算好再作为 prop 传下去。
 */
export function chapterList(
  id: string,
  content: SiteContent,
): ChapterPreviewList | undefined {
  switch (id) {
    case "favorites": {
      const years = [...content.favorites.years].sort((a, b) => b.year - a.year);
      return {
        heading: "FAVORITES",
        rows: years.flatMap((year) =>
          year.items.map((item) => ({
            name: item.name,
            note: String(year.year),
          })),
        ),
      };
    }
    case "projects":
      return {
        heading: "PROJECTS",
        rows: content.projects.items.map((project) => ({
          name: project.name,
          note: project.description,
        })),
      };
    case "game":
      return {
        heading: "GAMES",
        // 面板只出名字：游戏条目现在既没有评语也没有别的右栏数据（封面是章内横幅条的事，
        // 不进这个纯文字列表），所以右栏统一留空串——不是数据库意义上的「暂无」。
        rows: content.games.map((game) => ({ name: game.name, note: "" })),
      };
    case "music":
      return {
        heading: "MUSIC",
        rows: content.music.artists.map((artist) => ({
          name: artist.name,
          note: artist.note,
        })),
      };
    case "read":
      return {
        heading: "READING",
        // 右栏优先放短评；这本书没写短评就退回作者名（书单里多数只有作者）
        rows: content.books.map((book) => ({
          name: `《${book.title}》`,
          note: book.note ?? book.author,
        })),
      };
    default:
      return undefined;
  }
}
