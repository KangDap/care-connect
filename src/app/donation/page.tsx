'use client';

import { PublicHeader } from '@/components/public-header';
import { useRouter } from 'next/navigation';

import { DonationTypeSelector } from './DonationTypeSelector';

export default function DonationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f7f3ed]">
      <PublicHeader />
      <main className="flex-grow max-w-6xl mx-auto px-6 py-12 w-full">
        <DonationTypeSelector
          onSelectPlatform={() => router.push('/donation/platform')}
          onSelectReport={() => router.push('/donation/report')}
        />
      </main>
    </div>
  );
}
