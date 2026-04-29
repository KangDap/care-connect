import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

// Import komponen UI yang kita buat di awal tadi
import PsychologistDashboardContent from './PsychologistDashboardContent';

export default async function PsychologistDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // 1. Proteksi Halaman
  if (!session?.user) {
    redirect('/login');
  }

  // 2. Ambil data profil psikolog
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      role: true, // Pastikan role ada di database
    },
  });

  // Proteksi tambahan: kalau bukan psikolog, balikin ke dashboard user
  if (currentUser?.role !== 'PSYCHOLOGIST') {
    redirect('/dashboard/user');
  }

  // 3. Ambil data sesuai format yang temanmu kasih di foto
  const [consultations, totalConsCount, pendingConsCount, completedConsCount] =
    await Promise.all([
      // Ambil daftar konsultasi terbaru untuk psikolog ini
      prisma.consultation.findMany({
        where: { psychologistId: session.user.id }, // Filter berdasarkan ID Psikolog
        orderBy: { id: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          category: true,
          date: true,
          status: true,
          user: {
            // Ambil data pasien (user)
            select: {
              name: true,
            },
          },
        },
      }),

      // Hitung total konsultasi
      prisma.consultation.count({
        where: { psychologistId: session.user.id },
      }),

      // Hitung konsultasi yang PENDING / SCHEDULED (sesuai foto temanmu)
      prisma.consultation.count({
        where: {
          psychologistId: session.user.id,
          status: 'SCHEDULED',
        },
      }),

      // Hitung konsultasi yang COMPLETED (sesuai foto temanmu)
      prisma.consultation.count({
        where: {
          psychologistId: session.user.id,
          status: 'COMPLETED',
        },
      }),
    ]);

  const displayName = currentUser?.name || session.user.name || 'Psychologist';

  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-[#8EA087]">Loading psychologist panel...</div>
      }
    >
      <PsychologistDashboardContent
        consultations={consultations}
        displayName={displayName}
        totalConsultationsCount={totalConsCount}
        pendingConsultationsCount={pendingConsCount}
        completedConsultationsCount={completedConsCount}
      />
    </React.Suspense>
  );
}
