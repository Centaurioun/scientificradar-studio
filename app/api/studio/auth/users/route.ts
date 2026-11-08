import { assertSameOrigin, errorResponse, noStoreJson, readJson, requireActor } from '@/lib/publishing/server-http';
import { getServerPublishingStore, type ServerRole } from '@/lib/publishing/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = requireActor(request, ['owner']);
    const body = await readJson(request, 20_000);
    if (typeof body.email !== 'string' || typeof body.password !== 'string' || typeof body.role !== 'string') throw new Error('INVALID_USER');
    const user = getServerPublishingStore().createUser(actor, { email: body.email, password: body.password, role: body.role as ServerRole });
    return noStoreJson({ user }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
