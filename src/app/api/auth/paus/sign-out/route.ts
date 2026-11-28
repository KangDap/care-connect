import { runAuthRequest } from '@/lib/auth/reporting';

export function POST(request: Request) {
  return runAuthRequest(request, async () => {
    const expectedOrigin = process.env.BETTER_AUTH_URL
      ? new URL(process.env.BETTER_AUTH_URL).origin
      : new URL(request.url).origin;
    // This cookie-authenticated operation is only accepted from our own UI.
    if (request.headers.get('origin') !== expectedOrigin) {
      return Response.json({ message: 'Invalid origin' }, { status: 403 });
    }

    const { auth } = await import('@/lib/auth/auth');
    const { prisma } = await import('@/lib/prisma');
    const session = await auth.api.getSession({ headers: request.headers });
    const pausAccount = session
      ? await prisma.account.findFirst({
          where: { userId: session.user.id, providerId: 'paus' },
          select: { id: true },
        })
      : null;

    let providerUrl: string | undefined;
    if (pausAccount && process.env.PAUS_SIGN_OUT_URL) {
      const destination = process.env.PAUS_POST_LOGOUT_REDIRECT_URI;
      const clientId = process.env.PAUS_CLIENT_ID;
      if (!destination || !clientId) {
        return Response.json(
          { message: 'PAuS logout configuration is incomplete' },
          { status: 503 },
        );
      }
      const redirect = new URL(destination);
      const endpoint = new URL(process.env.PAUS_SIGN_OUT_URL);
      if (
        redirect.origin !== expectedOrigin ||
        !['http:', 'https:'].includes(endpoint.protocol)
      ) {
        return Response.json(
          { message: 'Invalid logout configuration' },
          { status: 503 },
        );
      }
      endpoint.searchParams.set('client_id', clientId);
      endpoint.searchParams.set('redirect_uri', redirect.toString());
      providerUrl = endpoint.toString();
    }

    // Let Better Auth invalidate the session and generate its cookie deletions.
    const localUrl = new URL(request.url);
    localUrl.pathname = '/api/auth/sign-out';
    localUrl.search = '';
    const headers = new Headers(request.headers);
    headers.delete('content-length');
    headers.set('content-type', 'application/json');
    const response = await auth.handler(
      new Request(localUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ disableRedirect: true }),
      }),
    );
    if (!response.ok) return response;
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-length');
    responseHeaders.delete('location');
    responseHeaders.set('cache-control', 'no-store');
    return Response.json(
      {
        success: true,
        url: providerUrl || new URL('/login', expectedOrigin).toString(),
      },
      { headers: responseHeaders },
    );
  });
}
