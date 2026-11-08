import { errorResponse, noStoreJson } from '@/lib/publishing/server-http';
import { getServerPublishingStore } from '@/lib/publishing/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const article = getServerPublishingStore().getPublicationBySlug((await params).slug);
    if (!article) return noStoreJson({ error: 'NOT_FOUND' }, { status: 404 });
    return noStoreJson(article);
  } catch (error) { return errorResponse(error); }
}
