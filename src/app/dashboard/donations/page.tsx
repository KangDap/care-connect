import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

import DonationsContent from './DonationsContent';

interface DonationItem {
  id: number;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  timestamp: string;
  reportId: number | null;
  midtransOrderId: string | null;
  snapToken: string | null;
  report: {
    title: string;
    description: string;
  } | null;
}

export const dynamic = 'force-dynamic';

export default async function DonationsPage() {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (e) {
    const err = e as { message?: string; digest?: string };
    if (
      err?.message?.includes('Dynamic server usage') ||
      err?.digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw e;
    }
    console.error('Failed to get session (donations):', e);
  }

  if (!session?.user) {
    redirect('/login');
  }

  let serializedDonations: DonationItem[] = [];
  try {
    const donations = await prisma.donation.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        amount: true,
        paymentMethod: true,
        paymentStatus: true,
        timestamp: true,
        reportId: true,
        midtransOrderId: true,
        snapToken: true,
        report: {
          select: {
            title: true,
            description: true,
          },
        },
      },
    });

    serializedDonations = donations.map((donation) => ({
      ...donation,
      amount: Number(donation.amount),
      timestamp: donation.timestamp.toISOString(),
    }));
  } catch (e) {
    console.error('Failed to fetch donations data:', e);
  }

  return (
    <React.Suspense
      fallback={<div className="p-12 text-[#8ea087]">Loading donations...</div>}
    >
      <DonationsContent donations={serializedDonations} />
    </React.Suspense>
  );
}
