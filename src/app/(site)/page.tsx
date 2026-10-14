import { AboutChapter } from "@/components/site/chapters/about-chapter";
import { ReadChapter } from "@/components/site/chapters/read-chapter";
import { FavoritesChapter } from "@/components/site/chapters/favorites-chapter";
import { GameChapter } from "@/components/site/chapters/game-chapter";
import { MusicChapter } from "@/components/site/chapters/music-chapter";
import { PostsChapter } from "@/components/site/chapters/posts-chapter";
import { ProjectsChapter } from "@/components/site/chapters/projects-chapter";
import { Hero } from "@/components/site/hero";
import { chapterLists } from "@/lib/content/preview";
import { getContent } from "@/lib/content/store";
import { PageIntro } from "@/components/site/page-intro";
import { ParallaxImages } from "@/components/site/parallax";
import { SectionIndex } from "@/components/site/section-index";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/**
 * 首页 = 整站：首屏 Hero 当封面，其后八章一路排到页脚，
 * 鼠标滚到底就能看完全站（章节顺序与 id 见 src/lib/chapters.ts）。
 * 原先那六个独立页面已改为重定向到对应章节（next.config.ts）。
 */
export default async function HomePage(props: { searchParams: SearchParams }) {
  // 展示内容（`data/content.json`，带 use cache）。这里读一次是为了给下面那行**客户端**
  // 目录卡片算「本章小预览」——客户端组件拿不到文件，只能由服务端算好传下去。
  // 各章节组件自己也会 await getContent()，同一个缓存条目，只读一次文件。
  const content = await getContent();

  return (
    <>
      {/* 视差引擎：封面图内部视差（水合后启动；手机端与减少动效下自动关闭） */}
      <ParallaxImages />

      {/* 整页加载入场：轻微缩放 + 模糊 → 清晰（0.9s） */}
      <PageIntro>
        <Hero />

        {/* 全站目录：Hero 正下方那行卡片（悬浮会画出通往目标章节的折线） */}
        <SectionIndex lists={chapterLists(content)} />

        <PostsChapter searchParams={props.searchParams} />
        <FavoritesChapter />
        <ProjectsChapter />
        <GameChapter />
        <MusicChapter />
        <ReadChapter />
        {/* 关于我压在页脚之前 */}
        <AboutChapter />
      </PageIntro>
    </>
  );
}
