import { fail } from '@/lib/api-response';
import { ApiError, Errors } from '@/lib/error';

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
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.status, error.details);
    }
    console.error('ARTICLE ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}
