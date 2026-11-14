import { ok } from '@/lib/api-response';
import { ArticleService } from '@/modules/article/article.service';

import { handleArticleRequest } from '../_shared';

export async function GET() {
  return handleArticleRequest(async () =>
    ok(await ArticleService.getCategories()),
  );
}
