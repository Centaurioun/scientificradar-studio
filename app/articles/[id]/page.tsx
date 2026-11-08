'use client';

import React, { use } from 'react';
import { ArticleWorkspaceRecoveryGate } from '@/components/editor/article-workspace-recovery-gate';

export default function ArticleDetailEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ArticleWorkspaceRecoveryGate articleId={id} />;
}
