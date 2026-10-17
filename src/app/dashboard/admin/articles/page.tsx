import { Suspense } from 'react';

import { ArticlesAdminClient } from './ArticlesAdminClient';

export const metadata = {
  title: 'Article Management | CareConnect Admin',
  description: 'Write, publish, and manage educational articles.',
};

export default function AdminArticlesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center text-sm font-bold text-[#8ea087]">
          Loading articles...
        </div>
      }
    >
      <ArticlesAdminClient />
    </Suspense>
  );
}
