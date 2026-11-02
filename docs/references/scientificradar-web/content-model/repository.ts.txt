import {
  DEMO_ARTICLES,
  DEMO_AUTHORS,
  DEMO_CATEGORIES,
} from "./fixtures";
import { normalizeSearchText } from "./sanitizer";
import {
  EditorialType,
  PublicArticle,
  PublicAuthor,
  PublicCategory,
  PublishedContentRepository,
  SupportedLocale,
} from "./types";

/**
 * Ensures draft, scheduled, archived, in_review, and withdrawn records
 * never leak into public reader listings or routes.
 * In Stage A, "demo" and "published" articles are visible.
 */
export function isPubliclyVisibleArticle(article: PublicArticle): boolean {
  return article.status === "demo" || article.status === "published";
}

export function filterArticles(
  articles: PublicArticle[],
  options?: {
    categorySlug?: string;
    subcategorySlug?: string;
    tagSlug?: string;
    query?: string;
    editorialType?: EditorialType;
    locale?: SupportedLocale;
    limit?: number;
  }
): PublicArticle[] {
  let result = articles.filter(isPubliclyVisibleArticle);

  if (options?.categorySlug) {
    result = result.filter((a) => a.categorySlug === options.categorySlug);
  }

  if (options?.subcategorySlug) {
    result = result.filter((a) =>
      a.subcategorySlugs.includes(options.subcategorySlug!)
    );
  }

  if (options?.tagSlug) {
    result = result.filter((a) => a.tagSlugs.includes(options.tagSlug!));
  }

  if (options?.editorialType) {
    result = result.filter((a) => a.editorialType === options.editorialType);
  }

  if (options?.locale) {
    result = result.filter((a) => a.locale === options.locale);
  }

  if (options?.query && options.query.trim().length > 0) {
    const normalizedQuery = normalizeSearchText(options.query);
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    result = result.filter((article) => {
      const category = DEMO_CATEGORIES.find(
        (c) => c.slug === article.categorySlug
      );
      const authors = DEMO_AUTHORS.filter((au) =>
        article.authorIds.includes(au.id)
      );
      const bodyText = article.blocks
        .map((b) => {
          if (b.type === "paragraph" || b.type === "heading") return b.text;
          if (b.type === "quote") return b.quote;
          if (b.type === "figure") return b.media.caption;
          if (b.type === "math") return `${b.label} ${b.explanation}`;
          if (b.type === "table")
            return `${b.table.caption} ${b.table.headers.join(" ")}`;
          if (b.type === "key-takeaways") return b.items.join(" ");
          return "";
        })
        .join(" ");

      const haystack = normalizeSearchText(
        [
          article.title,
          article.dek,
          article.summary,
          article.categorySlug,
          category?.name ?? "",
          article.subcategorySlugs.join(" "),
          article.tagSlugs.join(" "),
          authors.map((a) => a.name).join(" "),
          bodyText,
        ].join(" ")
      );

      return tokens.every((token) => haystack.includes(token));
    });
  }

  result = [...result].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );

  if (options?.limit && options.limit > 0) {
    result = result.slice(0, options.limit);
  }

  return result;
}

class InMemoryDemoContentRepository implements PublishedContentRepository {
  async listPublicArticles(options?: {
    categorySlug?: string;
    subcategorySlug?: string;
    tagSlug?: string;
    query?: string;
    editorialType?: EditorialType;
    locale?: SupportedLocale;
    limit?: number;
  }): Promise<PublicArticle[]> {
    return filterArticles(DEMO_ARTICLES, options);
  }

  async getPublicArticle(slug: string): Promise<PublicArticle | null> {
    const found = DEMO_ARTICLES.find((a) => a.slug === slug);
    if (!found || !isPubliclyVisibleArticle(found)) {
      return null;
    }
    return found;
  }

  async getCategories(): Promise<PublicCategory[]> {
    return DEMO_CATEGORIES;
  }

  async getCategoryBySlug(slug: string): Promise<PublicCategory | null> {
    return DEMO_CATEGORIES.find((c) => c.slug === slug) ?? null;
  }

  async getAuthorsByIds(ids: string[]): Promise<PublicAuthor[]> {
    return ids
      .map((id) => DEMO_AUTHORS.find((a) => a.id === id))
      .filter((a): a is PublicAuthor => Boolean(a));
  }

  async getRelatedArticles(
    article: PublicArticle,
    limit = 3
  ): Promise<PublicArticle[]> {
    const visible = DEMO_ARTICLES.filter(
      (a) => isPubliclyVisibleArticle(a) && a.id !== article.id
    );

    const explicit = article.relatedIds
      .map((id) => visible.find((a) => a.id === id))
      .filter((a): a is PublicArticle => Boolean(a));

    const sameCategory = visible.filter(
      (a) =>
        a.categorySlug === article.categorySlug &&
        !explicit.some((e) => e.id === a.id)
    );

    const fallback = visible.filter(
      (a) =>
        !explicit.some((e) => e.id === a.id) &&
        !sameCategory.some((s) => s.id === a.id)
    );

    return [...explicit, ...sameCategory, ...fallback].slice(0, limit);
  }
}

export const contentRepository = new InMemoryDemoContentRepository();

export function getCategoryName(categorySlug: string): string {
  return (
    DEMO_CATEGORIES.find((c) => c.slug === categorySlug)?.name ?? categorySlug
  );
}

export function getEditorialTypeLabel(type: EditorialType): string {
  switch (type) {
    case "feature":
      return "Feature";
    case "explainer":
      return "Explainer";
    case "research-digest":
      return "Research Digest";
    case "news":
      return "Analysis";
  }
}

export function formatPublicationDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const year = match[1];
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  return `${months[monthIdx] ?? match[2]} ${day}, ${year}`;
}
