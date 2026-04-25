import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

import ReportsContent from './ReportsContent';

export default async function ReportsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/login');
  }

  const reports = await prisma.report.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      category: true,
      description: true,
      province: true,
      city: true,
      district: true,
      incidentDate: true,
      status: true,
      isAnonymous: true,
      createdAt: true,
      evidences: {
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
        },
      },
    },
  });

  const serializedReports = reports.map((report) => ({
    ...report,
    createdAt: report.createdAt.toISOString(),
    incidentDate: report.incidentDate.toISOString(),
  }));

  return (
    <React.Suspense
      fallback={<div className="p-12 text-[#8EA087]">Loading reports...</div>}
    >
      <ReportsContent reports={serializedReports} />
    </React.Suspense>
  );
}
