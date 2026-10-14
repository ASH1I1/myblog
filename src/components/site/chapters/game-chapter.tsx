import { Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { getContent } from "@/lib/content/store";

/**
 * 06 游戏：全时段榜单（ALL-TIME）。
 *
 * 本章现在**只有这一块**：2026-10-14 按需求删掉了上面的「正在玩（PLAYING）」——
 * 三张游戏卡（底特律变人 / 荒野大镖客 / 勇者斗恶龙11）与数据层的 `games.recent` 一起去掉，
 * 那三张封面文件留在 public/games/（ALL-TIME 里同名的三条本来就在用同一批图）。
 *
 * 本块是**左文字、右封面缩略图**的横幅条，九款带 01–09 名次（见下方 `GameStrip`）。
 *
 * 本章还**没有右侧悬浮预览面板**（同一天早些时候整体删除，与音乐 / 读过两章同一批）：
 * 面板内容取自 `chapterList("game")`＝「第 04 章 + 标题 + 标语 + 这份榜单」，
 * 与下面这份列表整份重复，所以连触发器一并摘掉；正文（标题、列表、数据）一字未动，
 * 文章列表、目录卡片与最爱 / 项目两章的预览照旧。
 */
export async function GameChapter() {
  const content = await getContent();

  return (
    <Chapter id="game">
      <section className="mt-14">
        <Reveal>
          <h3 className="type-label font-mono tracking-[0.35em] text-faint">ALL-TIME</h3>
        </Reveal>
        {/* 容器顶部一条 1px 线收口 + 每条自带下边框＝条目之间的浅灰细分隔线，
            与「最爱」各年份的列表结构完全一致 */}
        <div className="mt-5 border-t border-border">
          {content.games.map((game, index) => (
            <Reveal key={game.name} delay={index * 0.08}>
              {/* 这是榜单、有名次，所以保留等宽编号 */}
              <GameStrip
                rank={index + 1}
                name={game.name}
                cover={game.cover}
                imagePosition={game.imagePosition}
              />
            </Reveal>
          ))}
        </div>
      </section>
    </Chapter>
  );
}

/**
 * 一条游戏横幅：**左文字、右封面缩略图**（ALL-TIME 的每一款都是这一条）。
 *
 * 版式照「最爱」页那条 `FavoriteStrip`（favorite-strip.tsx）：高度 4.65rem（＝全站列表行高）、
 * `rounded-lg` + 1px 下边框、`bg-white/40` 半透明底 + hover 提亮、左侧 20px 内边距、
 * 图区占条宽 29% 顶到最右缘、图片 `object-cover` 叠 `scale-[1.2]` 取景、
 * 图区左右两端用渐隐遮罩融进条里。**这套尺寸是定稿**（见 render 里的注释）。
 *
 * **没有直接复用 FavoriteStrip**：那条是「链接 + 名字 + 描述 + 徽标」的形态
 * （必填 href、描述，走 <Link>/<a>），而这条是纯展示——没有跳转目标、也没有描述文字，
 * 硬套会给那个共享组件加上一串可选分支。将来若两处版式要一起改，该做的是把「条」
 * 这层抽成一个共有组件，而不是继续各改各的。
 *
 * `rank` 可选：ALL-TIME 用它出等宽编号（01…09）。`cover` 可选：没填就只显示文字、
 * 右侧留白——不塞占位图（那是「裂图」观感的来源）。
 *
 * `imagePosition` 可选：逐条覆盖 `object-position`（默认 `"50% 50%"`）。
 * 这条缩略图只露原图很窄的一条横带（竖版封面约 12.5% 高度），主体不在正中就得逐条挑
 * ——值写进 inline style，因为 Tailwind 的任意值类名是编译期的，运行时算不出来。
 */
function GameStrip({
  rank,
  name,
  cover,
  imagePosition,
}: {
  rank?: number;
  name: string;
  cover?: string;
  imagePosition?: string;
}) {
  return (
    <div className="relative flex h-[4.65rem] items-center gap-4 overflow-hidden rounded-lg border-b border-border bg-white/40 pl-5 transition-colors duration-300 ease-out hover:bg-white/75">
      <span className="relative flex items-baseline gap-4">
        {rank ? (
          <span className="type-label font-mono text-faint">
            {String(rank).padStart(2, "0")}
          </span>
        ) : null}
        <span className="type-body font-medium">{name}</span>
      </span>

      {/* 右侧图区：**窄横幅**——条的 29% 宽 × 条高（约 4.4:1），图 `object-cover` 再叠
          `scale-[1.2]` 取景。这个尺寸是照「最爱」页那条横幅定的，**不要再改**：
          2026-10-14 中途试过把它放大成 3:2 的缩略图，用户随后要求还原（`h-[4.65rem]`、
          `w-[29%]`、`scale-[1.2]` 一并退回），理由是图区一改，整列列表的观感就变了。
          代价是竖版封面只露原图约 12.5% 的高度，人脸要完整放下得刚好对得准——
          逐条用 `imagePosition` 挑位置（见 showcase.ts 的公式）；原画里压根没有正脸、
          或脸小到塞不进这条带子的，改的是**换横版图**，而不是改这里。 */}
      {cover ? (
        <span className="relative ml-auto h-full w-[29%] shrink-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            aria-hidden="true"
            loading="lazy"
            style={{ objectPosition: imagePosition ?? "50% 50%" }}
            className="absolute inset-0 h-full w-full scale-[1.2] object-cover"
          />
        </span>
      ) : null}
    </div>
  );
}
