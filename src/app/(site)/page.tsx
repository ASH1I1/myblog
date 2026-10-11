import { Suspense } from "react";
import Link from "next/link";
// motion-kit 的 Reveal 与本仓库 site/reveal 的 Reveal 同名，故重命名后引入
import { CountUp, Reveal as KitReveal } from "@/components/motion-kit";
import { Hero } from "@/components/site/hero";
import { PageIntro } from "@/components/site/page-intro";
import { ParallaxImages } from "@/components/site/parallax";
import { PostCard } from "@/components/site/post-card";
import { PostListSkeleton } from "@/components/site/post-list-skeleton";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";
import { SectionLabel } from "@/components/site/section-label";
import { Pagination } from "@/components/ui/pagination";
import { getPublishedPostsPage } from "@/lib/db/queries";
import { SECTION_ICONS } from "@/lib/icons";
import { heroProfile, showcaseNav } from "@/lib/showcase";
import { siteConfig } from "@/lib/site-config";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function HomePage(props: { searchParams: SearchParams }) {
  // 缓存读取：用于「01 最新文章」的篇数（与列表共用同一缓存条目）
  const { total } = await getPublishedPostsPage(1);

  return (
    <>
      {/* 视差引擎：封面图内部视差（水合后启动；手机端与减少动效下自动关闭） */}
      <ParallaxImages />

      {/* 整页加载入场：轻微缩放 + 模糊 → 清晰（0.9s） */}
      <PageIntro>
        {/* 首屏：超大细体站名 + 短标语 */}
        <Hero />

        {/* 01 最新文章：三列卡片 */}
        <section aria-labelledby="section-posts" className="border-t border-border">
          <div className="container-page py-16 md:py-24">
            <SectionLabel
              id="section-posts"
              trailing={
                <span className="type-label font-mono text-faint">
                  共 <CountUp to={total} className="tabular-nums" /> 篇
                </span>
              }
            >
              01 最新文章
            </SectionLabel>
            <Suspense fallback={<PostListSkeleton />}>
              <PostList searchParams={props.searchParams} />
            </Suspense>
          </div>
        </section>

        {/* 02 我的栏目：横向卡片列表（图标 + 一句介绍） */}
        <section aria-labelledby="section-columns" className="border-t border-border">
          <div className="container-page py-16 md:py-24">
            <SectionLabel id="section-columns">02 我的栏目</SectionLabel>

            <Stagger
              className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
              gap={0.06}
            >
              {showcaseNav.map((item) => {
                const Icon = SECTION_ICONS[item.href];
                return (
                  <StaggerItem key={item.href} className="h-full">
                    <Link
                      href={item.href}
                      className="group flex h-full flex-col rounded-2xl border border-border bg-background p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-klein"
                    >
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.75}
                        className="h-4 w-4 text-muted transition-colors duration-300 ease-out group-hover:text-klein"
                      />
                      <span className="type-body mt-4 font-medium">{item.label}</span>
                      <span className="type-label mt-2 text-muted">{item.tagline}</span>
                    </Link>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        </section>

        {/* 03 关于我：头像 + 一句话自我介绍（名片式） */}
        <section aria-labelledby="section-about" className="border-t border-border">
          <div className="container-page py-16 md:py-24">
            <SectionLabel id="section-about">03 关于我</SectionLabel>

            <Reveal delay={0.08}>
              <Link
                href="/about"
                className="group mt-8 flex max-w-xl items-center gap-5 rounded-2xl border border-border bg-background p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-klein"
              >
                {siteConfig.author.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={siteConfig.author.avatar}
                    alt={`${siteConfig.author.name} 的头像`}
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-klein/10 text-xl font-bold text-klein"
                  >
                    {siteConfig.name.charAt(0)}
                  </span>
                )}

                <span>
                  <span className="type-body block font-medium">
                    {siteConfig.author.name}
                  </span>
                  <span className="type-body mt-1.5 block text-muted">
                    {heroProfile.intro}
                  </span>
                </span>
              </Link>
            </Reveal>
          </div>
        </section>
      </PageIntro>
    </>
  );
}

async function PostList({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const data = await getPublishedPostsPage(parsePage(params.page));

  // 空状态：一篇文章都没有（PRD 3.2.1）
  if (data.total === 0) {
    return (
      <Reveal className="mt-8">
        <div className="rounded-xl border border-dashed border-border bg-background px-6 py-20 text-center">
          <p className="type-body text-muted">暂无文章，敬请期待</p>
        </div>
      </Reveal>
    );
  }

  return (
    <div className="mt-8 space-y-12">
      {/* 三列网格（平板两列、手机单列），卡片逐张错开浮现（每张 80ms，motion-kit 的 Reveal） */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((post, index) => (
          <KitReveal key={post.id} delay={index * 0.08} className="h-full">
            <PostCard post={post} />
          </KitReveal>
        ))}
      </div>

      <Reveal>
        <Pagination basePath="/" page={data.page} totalPages={data.totalPages} />
      </Reveal>
    </div>
  );
}
