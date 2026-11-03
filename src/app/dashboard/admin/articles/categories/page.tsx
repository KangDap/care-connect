import { redirect } from 'next/navigation';

import { ARTICLE_CATEGORIES_HREF } from '../article-management-tabs';

/**
 * Categories now live in a tab of Article Management. This route is kept so
 * old links and bookmarks still land on the right place.
 */
export default function ArticleCategoriesRedirect() {
  redirect(ARTICLE_CATEGORIES_HREF);
}
