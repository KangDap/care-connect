'use client';

import { PublicHeader } from '@/components/public-header';
import { useRouter } from 'next/navigation';
import React from 'react';

import { ReportPicker } from '../ReportPicker';

export default function DonationReportPickerPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f7f3ed]">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl flex-grow px-6 py-12">
        <React.Suspense
          fallback={
            <div className="py-16 text-center text-sm font-bold text-[#8ea087]">
              Loading reports...
            </div>
          }
        >
          <ReportPicker
            onSelect={(report) => router.push(`/donation/report/${report.id}`)}
            onBack={() => router.push('/donation')}
          />
        </React.Suspense>
      </main>
    </div>
  );
}
