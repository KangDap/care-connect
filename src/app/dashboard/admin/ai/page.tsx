import { Suspense } from 'react';

import { AIAnalysisClient } from './AIAnalysisClient';

export const metadata = {
  title: 'AI Analysis | CareConnect Admin',
  description: 'Analyze report patterns with the CareConnect AI service.',
};

export default function AdminAIAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center text-sm font-bold text-[#8ea087]">
          Loading AI analysis...
        </div>
      }
    >
      <AIAnalysisClient />
    </Suspense>
  );
}
