import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

import DonationsContent from './DonationsContent';

export default async function DonationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/login');
  }

  const donations = await prisma.donation.findMany({
    where: { userId: session.user.id },
    orderBy: { timestamp: 'desc' },
    select: {
      id: true,
      amount: true,
      paymentMethod: true,
      paymentStatus: true,
      timestamp: true,
      report: {
        select: {
          title: true,
        },
      },
    },
  });

  const serializedDonations = donations.map((donation) => ({
    ...donation,
    amount: Number(donation.amount),
    timestamp: donation.timestamp.toISOString(),
  }));

  return (
    <React.Suspense
      fallback={<div className="p-12 text-[#8EA087]">Loading donations...</div>}
    >
      <DonationsContent donations={serializedDonations} />
    </React.Suspense>
  );
}
