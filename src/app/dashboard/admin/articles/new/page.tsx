import { Suspense } from 'react';

import { ArticleEditor } from '../ArticleEditor';

export const metadata = {
  title: 'New Article | CareConnect Admin',
  description: 'Write a new educational article.',
};

export default function NewArticlePage() {
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center text-sm font-bold text-[#8ea087]">
          Loading editor...
        </div>
      }
    >
      <ArticleEditor articleId={null} />
    </Suspense>
  );
}
