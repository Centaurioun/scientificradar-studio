import type { Article } from './types';

/** Preserve scientific editorial metadata when a partial article update omits those fields. */
export function mergeArticleEditorialMetadata(input: Partial<Article>, existing?: Article) {
  return {
    relatedIds: input.relatedIds !== undefined ? input.relatedIds : existing?.relatedIds ?? [],
    keyConcepts: input.keyConcepts !== undefined ? input.keyConcepts : existing?.keyConcepts ?? [],
    editorialNotices: input.editorialNotices !== undefined ? input.editorialNotices : existing?.editorialNotices ?? [],
  };
}
