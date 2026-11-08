import { assertSameOrigin, errorResponse, noStoreJson, readJson, requireActor } from '@/lib/publishing/server-http';
import { getServerPublishingStore } from '@/lib/publishing/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = requireActor(request, ['owner', 'editor', 'author']);
    const body = await readJson(request, 20_000);
    if (typeof body.id !== 'string' || typeof body.term !== 'string' || (body.targetType !== 'internal' && body.targetType !== 'wikipedia') || typeof body.targetUrl !== 'string' || (body.locale !== 'en' && body.locale !== 'tr') || typeof body.previewTitle !== 'string' || typeof body.previewExcerpt !== 'string' || typeof body.sourceAttribution !== 'string') throw new Error('INVALID_KNOWLEDGE_LINK');
    getServerPublishingStore().createKnowledgeLink(actor, { id: body.id, term: body.term, targetType: body.targetType, targetUrl: body.targetUrl, targetArticleId: typeof body.targetArticleId === 'string' ? body.targetArticleId : undefined, locale: body.locale, previewTitle: body.previewTitle, previewExcerpt: body.previewExcerpt, sourceAttribution: body.sourceAttribution });
    return noStoreJson({ ok: true, id: body.id, reviewStatus: 'suggested' }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
