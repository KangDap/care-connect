import { ok } from '@/lib/api-response';
import { ArticleSchema } from '@/modules/article/article.schema';
import { ArticleService } from '@/modules/article/article.service';

import { type ArticleRouteContext, handleArticleRequest } from '../_shared';

export async function GET(_req: Request, { params }: ArticleRouteContext) {
  return handleArticleRequest(async () => {
    const id = ArticleSchema.validateId((await params).id);
    return ok(await ArticleService.getArticleById(id, true));
  });
}
