import { assertSameOrigin, errorResponse, noStoreJson, readJson, requireActor } from '@/lib/publishing/server-http';
import { getServerPublishingStore } from '@/lib/publishing/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ articleId: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = requireActor(request, ['owner', 'editor', 'author']);
    const body = await readJson(request);
    const articleId = (await params).articleId;
    return noStoreJson(getServerPublishingStore().saveCandidate(actor, articleId, body.snapshot));
  } catch (error) { return errorResponse(error); }
}

export async function GET(_request: Request, { params }: { params: Promise<{ articleId: string }> }) {
  try {
    const actor = requireActor(_request, ['owner', 'editor', 'author', 'reviewer']);
    const articleId = (await params).articleId;
    return noStoreJson(getServerPublishingStore().loadCandidate(actor, articleId));
  } catch (error) { return errorResponse(error); }
}
