import { PaymentStatus } from '@/generated/prisma/enums';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

import DashboardContent from './DashboardContent';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
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
    console.error('Failed to get session (dashboard):', e);
  }

  if (!session?.user) {
    redirect('/login');
  }

  let currentUser = null;
  try {
    currentUser = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });
  } catch (e) {
    console.error('Failed to fetch current user (dashboard):', e);
  }

  if (currentUser?.role === 'ADMIN') {
    redirect('/dashboard/admin');
  } else if (currentUser?.role === 'PSYCHOLOGIST') {
    redirect('/dashboard/psikolog');
  }

  let consultations: {
    id: number;
    title: string;
    category: string;
    date: Date;
    status: string;
    psychologist: { name: string } | null;
  }[] = [];
  let reports: {
    id: number;
    title: string;
    status: string;
    createdAt: Date;
  }[] = [];
  let serializedDonations: { amount: number }[] = [];
  let totalConsCount = 0;
  let totalRepCount = 0;

  try {
    const [consultationsData, reportsData, donations, consCount, repCount] =
      await Promise.all([
        prisma.consultation.findMany({
          where: { userId: session!.user.id },
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
          where: { userId: session!.user.id },
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
              userId: session!.user.id,
            },
            paymentStatus: PaymentStatus.PAID,
          },
          select: {
            amount: true,
          },
        }),
        prisma.consultation.count({ where: { userId: session!.user.id } }),
        prisma.report.count({ where: { userId: session!.user.id } }),
      ]);

    consultations = consultationsData;
    reports = reportsData;
    serializedDonations = donations.map((item) => ({
      amount: Number(item.amount),
    }));
    totalConsCount = consCount;
    totalRepCount = repCount;
  } catch (e) {
    console.error('Failed to fetch dashboard data:', e);
  }

  const pendingReportsCount = reports.filter(
    (item) => item.status === 'PENDING',
  ).length;

  const displayName =
    currentUser?.name?.trim() ||
    session!.user.name?.trim() ||
    session!.user.email.split('@')[0] ||
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
