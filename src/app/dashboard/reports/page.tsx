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
    orderBy: { timestamp: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      timestamp: true,
    },
  });

  return (
    <React.Suspense
      fallback={<div className="p-12 text-[#8EA087]">Loading reports...</div>}
    >
      <ReportsContent reports={reports} />
    </React.Suspense>
  );
}
