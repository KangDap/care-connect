import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

import DashboardContent from './DashboardContent';

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/login');
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  const [consultations, reports, donations] = await Promise.all([
    prisma.consultation.findMany({
      where: { userId: session.user.id },
      orderBy: { id: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        category: true,
        date: true,
        status: true,
        psychologist: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.report.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.donation.findMany({
      where: { userId: session.user.id },
      select: {
        amount: true,
      },
    }),
  ]);

  const pendingReportsCount = reports.filter(
    (item) => item.status === 'PENDING',
  ).length;

  const displayName =
    currentUser?.name?.trim() ||
    session.user.name?.trim() ||
    session.user.email.split('@')[0] ||
    'there';

  return (
    <React.Suspense
      fallback={<div className="p-12 text-[#8EA087]">Loading dashboard...</div>}
    >
      <DashboardContent
        consultations={consultations}
        reports={reports}
        donations={donations}
        displayName={displayName}
        pendingReportsCount={pendingReportsCount}
      />
    </React.Suspense>
  );
}
