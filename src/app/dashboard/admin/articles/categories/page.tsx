import { Suspense } from 'react';

import { CategoriesClient } from './CategoriesClient';

export const metadata = {
  title: 'Article Categories | CareConnect Admin',
  description: 'Manage article categories.',
};

export default function ArticleCategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center text-sm font-bold text-[#8ea087]">
          Loading categories...
        </div>
      }
    >
      <CategoriesClient />
    </Suspense>
  );
}
