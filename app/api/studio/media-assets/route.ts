import { assertSameOrigin, errorResponse, noStoreJson, readJson, requireActor } from '@/lib/publishing/server-http';
import { getServerPublishingStore } from '@/lib/publishing/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = requireActor(request, ['owner', 'editor', 'author', 'reviewer', 'rights_reviewer']);
    const body = await readJson(request, 12 * 1024 * 1024);
    if (typeof body.mediaId !== 'string' || typeof body.dataUrl !== 'string' || typeof body.license !== 'string') throw new Error('INVALID_MEDIA');
    return noStoreJson(getServerPublishingStore().uploadMedia(actor, { mediaId: body.mediaId, dataUrl: body.dataUrl, license: body.license }));
  } catch (error) { return errorResponse(error); }
}
