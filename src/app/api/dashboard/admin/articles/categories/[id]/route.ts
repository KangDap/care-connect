import {
  type ArticleRouteContext,
  handleArticleRequest,
  readArticleJson,
} from '@/app/api/articles/_shared';
import { ok } from '@/lib/api-response';
import { ArticleSchema } from '@/modules/article/article.schema';
import { ArticleService } from '@/modules/article/article.service';

import { requireAdminSession } from '../../../_shared';

export async function PATCH(req: Request, { params }: ArticleRouteContext) {
  return handleArticleRequest(async () => {
    const { response } = await requireAdminSession();
    if (response) return response;
    const id = ArticleSchema.validateId((await params).id);
    const input = ArticleSchema.validateUpdateCategory(
      await readArticleJson(req),
    );
    return ok(await ArticleService.updateCategory(id, input));
  });
}

export async function DELETE(_req: Request, { params }: ArticleRouteContext) {
  return handleArticleRequest(async () => {
    const { response } = await requireAdminSession();
    if (response) return response;
    const id = ArticleSchema.validateId((await params).id);
    return ok(await ArticleService.deleteCategory(id));
  });
}
