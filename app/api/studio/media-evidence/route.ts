import { assertSameOrigin, errorResponse, noStoreJson, readJson, requireActor } from '@/lib/publishing/server-http';
import { getServerPublishingStore } from '@/lib/publishing/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = requireActor(request, ['owner', 'rights_reviewer']);
    const body = await readJson(request, 20_000);
    if (typeof body.evidenceId !== 'string' || typeof body.mediaId !== 'string' || typeof body.assetRevisionId !== 'string' || typeof body.license !== 'string') throw new Error('INVALID_EVIDENCE');
    getServerPublishingStore().registerRightsEvidence(actor, { evidenceId: body.evidenceId, mediaId: body.mediaId, assetRevisionId: body.assetRevisionId, license: body.license });
    return noStoreJson({ ok: true, reviewedBy: actor.id });
  } catch (error) { return errorResponse(error); }
}
