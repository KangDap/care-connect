import {
  handleArticleRequest,
  readArticleJson,
} from '@/app/api/articles/_shared';
import { created, ok } from '@/lib/api-response';
import { ArticleSchema } from '@/modules/article/article.schema';
import { ArticleService } from '@/modules/article/article.service';

import { requireAdminSession } from '../_shared';

export async function GET(req: Request) {
  return handleArticleRequest(async () => {
    const { response } = await requireAdminSession();
    if (response) return response;
    const query = ArticleSchema.validateQuery(
      new URL(req.url).searchParams,
      true,
    );
    return ok(await ArticleService.getArticles(query));
  });
}

export async function POST(req: Request) {
  return handleArticleRequest(async () => {
    const { response } = await requireAdminSession();
    if (response) return response;
    const input = ArticleSchema.validateCreateArticle(
      await readArticleJson(req),
    );
    return created(await ArticleService.createArticle(input));
  });
}
