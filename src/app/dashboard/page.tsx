import { PaymentStatus } from '@/generated/prisma/enums';
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
      role: true,
    },
  });

  if (currentUser?.role === 'ADMIN') {
    redirect('/dashboard/admin');
  } else if (currentUser?.role === 'PSYCHOLOGIST') {
    redirect('/dashboard/psikolog');
  }

  const [consultations, reports, donations, totalConsCount, totalRepCount] =
    await Promise.all([
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
        where: {
          report: {
            userId: session.user.id,
          },
          paymentStatus: PaymentStatus.PAID,
        },
        select: {
          amount: true,
        },
      }),

      prisma.consultation.count({ where: { userId: session.user.id } }),
      prisma.report.count({ where: { userId: session.user.id } }),
    ]);

  const serializedDonations = donations.map((item) => ({
    amount: Number(item.amount),
  }));

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
      fallback={<div className="p-12 text-[#8ea087]">Loading dashboard...</div>}
    >
      <DashboardContent
        consultations={consultations}
        reports={reports}
        donations={serializedDonations}
        displayName={displayName}
        pendingReportsCount={pendingReportsCount}
        totalConsultationsCount={totalConsCount}
        totalReportsCount={totalRepCount}
      />
    </React.Suspense>
  );
}
