import { assertSameOrigin, errorResponse, noStoreJson, readJson, requireActor } from '@/lib/publishing/server-http';
import { getServerPublishingStore, type ServerRole } from '@/lib/publishing/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = requireActor(request, ['owner']);
    const body = await readJson(request, 20_000);
    if (body.role !== undefined && typeof body.role !== 'string') throw new Error('INVALID_USER');
    if (body.disabled !== undefined && typeof body.disabled !== 'boolean') throw new Error('INVALID_USER');
    getServerPublishingStore().setUserAccess(actor, (await params).userId, { role: body.role as ServerRole | undefined, disabled: body.disabled as boolean | undefined });
    return noStoreJson({ ok: true });
  } catch (error) { return errorResponse(error); }
}
