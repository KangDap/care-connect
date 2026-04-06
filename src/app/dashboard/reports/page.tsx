import React from 'react';

import ReportsContent from './ReportsContent';

export default function ReportsPage() {
  return (
    <React.Suspense
      fallback={<div className="p-12 text-[#8EA087]">Loading reports...</div>}
    >
      <ReportsContent />
    </React.Suspense>
  );
}
