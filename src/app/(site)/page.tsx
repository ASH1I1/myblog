import { AboutChapter } from "@/components/site/chapters/about-chapter";
import { ReadChapter } from "@/components/site/chapters/read-chapter";
import { FavoritesChapter } from "@/components/site/chapters/favorites-chapter";
import { GameChapter } from "@/components/site/chapters/game-chapter";
import { MusicChapter } from "@/components/site/chapters/music-chapter";
import { PostsChapter } from "@/components/site/chapters/posts-chapter";
import { ProjectsChapter } from "@/components/site/chapters/projects-chapter";
import { Hero } from "@/components/site/hero";
import { PageIntro } from "@/components/site/page-intro";
import { ParallaxImages } from "@/components/site/parallax";
import { SectionIndex } from "@/components/site/section-index";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/**
 * 首页 = 整站：首屏 Hero 当封面，其后八章一路排到页脚，
 * 鼠标滚到底就能看完全站（章节顺序与 id 见 src/lib/chapters.ts）。
 * 原先那六个独立页面已改为重定向到对应章节（next.config.ts）。
 */
export default function HomePage(props: { searchParams: SearchParams }) {
  return (
    <>
      {/* 视差引擎：封面图内部视差（水合后启动；手机端与减少动效下自动关闭） */}
      <ParallaxImages />

      {/* 整页加载入场：轻微缩放 + 模糊 → 清晰（0.9s） */}
      <PageIntro>
        <Hero />

        {/* 全站目录：Hero 正下方那行卡片（悬浮会画出通往目标章节的折线） */}
        <SectionIndex />

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
