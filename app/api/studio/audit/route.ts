import { errorResponse, noStoreJson, requireActor } from '@/lib/publishing/server-http';
import { getServerPublishingStore } from '@/lib/publishing/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    requireActor(request, ['owner', 'editor']);
    const url = new URL(request.url);
    const articleId = url.searchParams.get('articleId') || undefined;
    return noStoreJson(getServerPublishingStore().getAuditEvents(articleId));
  } catch (error) { return errorResponse(error); }
}
