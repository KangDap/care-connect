import { ok } from '@/lib/api-response';
import { ArticleSchema } from '@/modules/article/article.schema';
import { ArticleService } from '@/modules/article/article.service';

import { handleArticleRequest } from './_shared';

export async function GET(req: Request) {
  return handleArticleRequest(async () => {
    const query = ArticleSchema.validateQuery(new URL(req.url).searchParams);
    return ok(await ArticleService.getArticles(query, true));
  });
}
