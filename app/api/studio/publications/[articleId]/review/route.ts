import { assertSameOrigin, errorResponse, noStoreJson, readJson, requireActor } from '@/lib/publishing/server-http';
import { getServerPublishingStore } from '@/lib/publishing/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ articleId: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = requireActor(request, ['owner', 'editor', 'reviewer']);
    const body = await readJson(request, 20_000);
    if (typeof body.revisionId !== 'string' || (body.decision !== 'approve' && body.decision !== 'request_changes')) throw new Error('INVALID_REVIEW');
    getServerPublishingStore().reviewCandidate(actor, (await params).articleId, body.revisionId, body.decision, typeof body.note === 'string' ? body.note : '');
    return noStoreJson({ ok: true, revisionId: body.revisionId, decision: body.decision, reviewedBy: actor.id });
  } catch (error) { return errorResponse(error); }
}
