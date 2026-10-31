'use client';

import React, { use } from 'react';
import { ArticlePreviewView } from '@/components/editor/article-preview-view';

export default function StandalonePublicArticlePreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ArticlePreviewView articleId={id} standalonePublicPreview />;
}
