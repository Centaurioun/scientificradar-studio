import { assertSameOrigin, errorResponse, noStoreJson, readJson, cookieToken } from '@/lib/publishing/server-http';
import { getServerPublishingStore, SERVER_SESSION_COOKIE, SERVER_SESSION_TTL_SECONDS } from '@/lib/publishing/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readJson(request, 16_000);
    if (typeof body.email !== 'string' || typeof body.password !== 'string') throw new Error('INVALID_USER');
    const result = getServerPublishingStore().login(body.email, body.password);
    if (!result) return noStoreJson({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
    const name = process.env.NODE_ENV === 'production' ? SERVER_SESSION_COOKIE : 'sr-studio-session';
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return noStoreJson({ actor: result.actor, expiresAt: result.expiresAt }, { headers: { 'Set-Cookie': `${name}=${encodeURIComponent(result.token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SERVER_SESSION_TTL_SECONDS}${secure}` } });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const store = getServerPublishingStore();
    store.revokeToken(cookieToken(request));
    const name = process.env.NODE_ENV === 'production' ? SERVER_SESSION_COOKIE : 'sr-studio-session';
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return noStoreJson({ ok: true }, { headers: { 'Set-Cookie': `${name}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}` } });
  } catch (error) { return errorResponse(error); }
}
