import { auth } from '@/lib/auth/auth';
import { NextRequest } from 'next/server';

/**
 * Backward-compatibility handler for callers requesting /api/auth/sign-in/oauth2.
 * Better Auth natively registers generic OAuth providers under /api/auth/sign-in/social
 * with body field "provider". This route bridges the two formats seamlessly.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const provider = body.provider || body.providerId || 'paus';
    const transformedBody = {
      ...body,
      provider,
    };

    const url = new URL(request.url);
    url.pathname = '/api/auth/sign-in/social';

    const socialRequest = new Request(url.toString(), {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(transformedBody),
    });

    return auth.handler(socialRequest);
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to process OAuth2 sign-in',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
