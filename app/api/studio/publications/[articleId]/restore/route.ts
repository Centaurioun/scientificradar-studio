import { assertSameOrigin, errorResponse, noStoreJson, readJson, requireActor } from '@/lib/publishing/server-http';
import { getServerPublishingStore } from '@/lib/publishing/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ articleId: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = requireActor(request, ['owner', 'editor']);
    const body = await readJson(request, 20_000);
    if (typeof body.revisionId !== 'string') throw new Error('INVALID_SNAPSHOT_IDENTITY');
    const result = getServerPublishingStore().restore(actor, (await params).articleId, body.revisionId, request.headers.get('idempotency-key') ?? '');
    return noStoreJson(result);
  } catch (error) { return errorResponse(error); }
}
