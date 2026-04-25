import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

import ConsultationsContent from './ConsultationsContent';

export default async function ConsultationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/login');
  }

  const consultations = await prisma.consultation.findMany({
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

  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-[#8EA087]">Loading consultations...</div>
      }
    >
      <ConsultationsContent consultations={consultations} />
    </React.Suspense>
  );
}
