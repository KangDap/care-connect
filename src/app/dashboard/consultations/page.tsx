import React from 'react';

import ConsultationsContent from './ConsultationsContent';

export default function ConsultationsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-[#8EA087]">Loading consultations...</div>
      }
    >
      <ConsultationsContent />
    </React.Suspense>
  );
}
