'use client';

import React, { use } from 'react';
import PagePreviewRoute from '@/app/pages/[id]/preview/page';

export default function PublicPagePreviewAlias({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <PagePreviewRoute params={params} />;
}
