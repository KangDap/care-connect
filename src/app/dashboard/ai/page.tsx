import { Card } from '@/components/card';
import { Suspense } from 'react';

import { AIAnalysisClient } from '../admin/ai/AIAnalysisClient';

export const metadata = {
  title: 'AI Analysis | CareConnect Dashboard',
  description: 'AI insights for CareConnect users.',
};

export default function UserAIAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center text-sm font-bold text-[#8ea087]">
          Loading AI analysis...
        </div>
      }
    >
      <AIAnalysisClient
        badgeLabel="User AI"
        title="AI Support Insights"
        description="Explore AI-assisted insights prepared for safer reporting, better support decisions, and clearer next steps."
        emptyTitle="AI insights are ready for this dashboard"
        emptyDescription="The current backend contract exposes report pattern analysis through the admin endpoint only, so this user tab is prepared without calling the admin-only service."
        canRunAnalysis={false}
        unavailableNotice={
          <Card className="border-amber-200 bg-amber-50 p-4">
            <p className="font-black text-amber-800">
              User access is waiting on backend permission.
            </p>
            <p className="mt-1 text-sm font-medium text-amber-800/80">
              The AI analyze API currently validates ADMIN role. This user tab
              is available in the dashboard now, and can start running analysis
              as soon as the backend exposes a user-safe endpoint or permission.
            </p>
          </Card>
        }
      />
    </Suspense>
  );
}
