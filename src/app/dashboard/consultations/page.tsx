import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

import ConsultationsContent from './ConsultationsContent';

interface ConsultationItem {
  id: number;
  title: string;
  category: string;
  description: string;
  date: Date;
  time: Date;
  status: string;
  isAnonymous: boolean;
  attachmentUrl: string | null;
  psychologist: { name: string | null } | null;
}

export const dynamic = 'force-dynamic';

export default async function ConsultationsPage() {
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
    console.error('Failed to get session (consultations):', e);
  }

  if (!session?.user) {
    redirect('/login');
  }

  let consultations: ConsultationItem[] = [];
  try {
    consultations = await prisma.consultation.findMany({
      where: { userId: session.user.id },
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        date: true,
        time: true,
        status: true,
        isAnonymous: true,
        attachmentUrl: true,
        psychologist: {
          select: {
            name: true,
          },
        },
      },
    });
  } catch (e) {
    console.error('Failed to fetch consultations data:', e);
  }

  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-[#8ea087]">Loading consultations...</div>
      }
    >
      <ConsultationsContent consultations={consultations} />
    </React.Suspense>
  );
}
