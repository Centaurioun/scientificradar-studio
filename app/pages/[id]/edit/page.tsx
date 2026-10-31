'use client';

import React, { use } from 'react';
import { PageWorkspace } from '@/components/editor/page-workspace';

export default function EditStaticPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <PageWorkspace pageId={id} />;
}
