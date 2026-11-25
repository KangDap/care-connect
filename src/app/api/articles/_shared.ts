import { fail } from '@/lib/api-response';
import { ApiError, Errors } from '@/lib/error';
import { reportServerError } from '@/lib/server-error';

export type ArticleRouteContext = { params: Promise<{ id: string }> };

export async function readArticleJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw Errors.badRequest('Request body must be valid JSON');
  }
}

export async function handleArticleRequest(operation: () => Promise<Response>) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) {
      return fail(error.code, error.message, error.status, error.details);
    }
    const reference = reportServerError(error, 'article');
    const response = fail(
      'INTERNAL_SERVER_ERROR',
      'Internal server error',
      500,
      { reference },
    );
    response.headers.set('X-Error-Reference', reference);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
}
