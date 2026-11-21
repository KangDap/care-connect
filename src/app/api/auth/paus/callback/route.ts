import { auth } from '@/lib/auth/auth';
import { NextRequest } from 'next/server';

/**
 * Dedicated callback handler for DPSI PAuS redirect URI:
 * https://careconnect.fmipa.unpad.ac.id/api/auth/paus/callback
 *
 * Better Auth internally listens on /api/auth/callback/paus.
 * This route ensures that if PAuS redirects directly to /api/auth/paus/callback,
 * the authorization code and state are forwarded seamlessly to Better Auth.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = '/api/auth/callback/paus';

  const callbackRequest = new Request(url.toString(), {
    method: 'GET',
    headers: request.headers,
  });

  return auth.handler(callbackRequest);
}
