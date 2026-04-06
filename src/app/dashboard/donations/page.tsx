import React from 'react';

import DonationsContent from './DonationsContent';

export default function DonationsPage() {
  return (
    <React.Suspense
      fallback={<div className="p-12 text-[#8EA087]">Loading donations...</div>}
    >
      <DonationsContent />
    </React.Suspense>
  );
}
