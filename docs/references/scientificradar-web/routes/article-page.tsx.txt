import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import Footer from "@/components/site/Footer";
import ArticleHeader from "@/components/editorial/ArticleHeader";
import ArticleReader from "@/components/editorial/ArticleReader";
import RelatedStories from "@/components/editorial/RelatedStories";
import NewsletterDemo from "@/components/editorial/NewsletterDemo";
import { contentRepository } from "@/lib/content/repository";
import { ReadingMeasureOption } from "@/lib/design/tokens";

import { buildPageMetadata } from "@/lib/seo/metadata";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ measure?: string; designReview?: string }>;
}

export async function generateStaticParams() {
  const articles = await contentRepository.listPublicArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await contentRepository.getPublicArticle(slug);

  if (!article) {
    return buildPageMetadata({
      routeType: "not-found",
      pathname: `/article/${slug}`,
      title: "Article Not Found",
    });
  }

  return buildPageMetadata({
    routeType: "article",
    pathname: `/article/${article.slug}`,
    article,
  });
}

export default async function ArticlePage({
  params,
  searchParams,
}: ArticlePageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const showReviewControls = resolvedSearchParams?.designReview === "1";

  const article = await contentRepository.getPublicArticle(slug);
  if (!article) {
    notFound();
  }

  const [category, authors, relatedArticles] = await Promise.all([
    contentRepository.getCategoryBySlug(article.categorySlug),
    contentRepository.getAuthorsByIds(article.authorIds),
    contentRepository.getRelatedArticles(article, 3),
  ]);

  const initialMeasure: ReadingMeasureOption =
    resolvedSearchParams.measure === "600"
      ? "600"
      : resolvedSearchParams.measure === "560"
        ? "560"
        : "700";

  return (
    <>
      <SiteHeader activeCategorySlug={article.categorySlug} />

      <main id="main-content" className="flex-1">
        <article>
          <ArticleHeader
            article={article}
            category={category}
            authors={authors}
          />
          <ArticleReader
            key={initialMeasure}
            article={article}
            authors={authors}
            initialMeasure={initialMeasure}
            showReviewControls={showReviewControls}
          />
        </article>

        <RelatedStories articles={relatedArticles} />
        <NewsletterDemo />
      </main>

      <Footer />
    </>
  );
}
