import { assertSameOrigin, errorResponse, noStoreJson, readJson, requireActor } from '@/lib/publishing/server-http';
import { getServerPublishingStore } from '@/lib/publishing/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = requireActor(request, ['owner', 'editor', 'reviewer']);
    const body = await readJson(request, 20_000);
    if (body.decision !== 'approve' && body.decision !== 'reject') throw new Error('INVALID_REVIEW');
    getServerPublishingStore().reviewKnowledgeLink(actor, (await params).id, body.decision);
    return noStoreJson({ ok: true, id: (await params).id, decision: body.decision, reviewedBy: actor.id });
  } catch (error) { return errorResponse(error); }
}
