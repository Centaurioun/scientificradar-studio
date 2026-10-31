'use client';

import React, { use } from 'react';
import { ArticleWorkspace } from '@/components/editor/article-workspace';

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ArticleWorkspace articleId={id} />;
}
