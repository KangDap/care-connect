import { runAuthRequest } from '@/lib/auth/reporting';
import { toNextJsHandler } from 'better-auth/next-js';

export const GET = (request: Request) =>
  runAuthRequest(request, async () => {
    const { auth } = await import('@/lib/auth/auth');
    return toNextJsHandler(auth).GET(request);
  });

export const POST = (request: Request) =>
  runAuthRequest(request, async () => {
    const { auth } = await import('@/lib/auth/auth');
    return toNextJsHandler(auth).POST(request);
  });
