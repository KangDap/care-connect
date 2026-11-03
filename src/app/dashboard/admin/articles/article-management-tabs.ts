/** Routes for the two tabs of the admin Article Management page. */
export const ARTICLE_MANAGEMENT_HREF = '/dashboard/admin/articles';
export const ARTICLE_CATEGORIES_HREF = `${ARTICLE_MANAGEMENT_HREF}?tab=categories`;

export type ArticleManagementTab = 'articles' | 'categories';

export const parseArticleManagementTab = (
  value: string | null | undefined,
): ArticleManagementTab => (value === 'categories' ? 'categories' : 'articles');
