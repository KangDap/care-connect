import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

import ReportsContent from './ReportsContent';

interface ReportItem {
  id: number;
  title: string;
  category: string;
  description: string;
  province: string;
  city: string;
  district: string;
  incidentDate: string;
  status: string;
  isAnonymous: boolean;
  createdAt: string;
  evidences: {
    id: number;
    fileName: string;
    fileUrl: string;
  }[];
}

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
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
    console.error('Failed to get session (reports):', e);
  }

  if (!session?.user) {
    redirect('/login');
  }

  let serializedReports: ReportItem[] = [];
  try {
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

    serializedReports = reports.map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
      incidentDate: report.incidentDate.toISOString(),
    }));
  } catch (e) {
    console.error('Failed to fetch reports data:', e);
  }

  return (
    <React.Suspense
      fallback={<div className="p-12 text-[#8ea087]">Loading reports...</div>}
    >
      <ReportsContent reports={serializedReports} />
    </React.Suspense>
  );
}
