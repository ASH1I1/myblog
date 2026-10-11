import { AboutChapter } from "@/components/site/chapters/about-chapter";
import { BooksChapter } from "@/components/site/chapters/books-chapter";
import { ColumnsChapter } from "@/components/site/chapters/columns-chapter";
import { FavoritesChapter } from "@/components/site/chapters/favorites-chapter";
import { GameChapter } from "@/components/site/chapters/game-chapter";
import { MusicChapter } from "@/components/site/chapters/music-chapter";
import { PostsChapter } from "@/components/site/chapters/posts-chapter";
import { ProjectsChapter } from "@/components/site/chapters/projects-chapter";
import { Hero } from "@/components/site/hero";
import { PageIntro } from "@/components/site/page-intro";
import { ParallaxImages } from "@/components/site/parallax";

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

        <PostsChapter searchParams={props.searchParams} />
        <ColumnsChapter />
        <AboutChapter />
        <FavoritesChapter />
        <ProjectsChapter />
        <GameChapter />
        <MusicChapter />
        <BooksChapter />
      </PageIntro>
    </>
  );
}
