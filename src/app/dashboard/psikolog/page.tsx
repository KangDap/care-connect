import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

// Import komponen UI yang kita buat di awal tadi
import PsychologistDashboardContent from './PsychologistDashboardContent';

interface DashboardConsultation {
  id: number;
  title: string;
  category: string;
  date: Date;
  status: string;
  isAnonymous?: boolean;
  user: { name: string | null } | null;
}

export const dynamic = 'force-dynamic';

export default async function PsychologistDashboardPage() {
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
    console.error('Failed to get session (psychologist dashboard):', e);
  }

  // 1. Proteksi Halaman
  if (!session?.user) {
    redirect('/login');
  }

  // 2. Ambil data profil psikolog
  let currentUser = null;
  try {
    currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        role: true, // Pastikan role ada di database
      },
    });
  } catch (e) {
    console.error('Failed to fetch current user (psychologist dashboard):', e);
  }

  // Proteksi tambahan: kalau bukan psikolog, balikin ke dashboard user
  if (currentUser && currentUser.role !== 'PSYCHOLOGIST') {
    redirect('/dashboard/user');
  }

  let upcomingConsultations: DashboardConsultation[] = [];
  let completedConsultations: DashboardConsultation[] = [];
  let totalConsCount = 0;
  let pendingConsCount = 0;
  let completedConsCount = 0;
  let monthlyEarnings = 0;

  try {
    const [
      upcoming,
      completed,
      consCount,
      pendingCount,
      completedCount,
      monthlyPlatformDonations,
      totalMonthlyCons,
      myMonthlyCons,
    ] = await Promise.all([
      // Ambil daftar konsultasi upcoming (SCHEDULED, ONGOING)
      prisma.consultation.findMany({
        where: {
          psychologistId: session.user.id,
          status: { in: ['SCHEDULED', 'ONGOING'] },
        },
        orderBy: { id: 'desc' },
        take: 3,
        select: {
          id: true,
          title: true,
          category: true,
          date: true,
          status: true,
          isAnonymous: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      }),

      // Ambil daftar konsultasi completed (COMPLETED, CANCELLED)
      prisma.consultation.findMany({
        where: {
          psychologistId: session.user.id,
          status: { in: ['COMPLETED', 'CANCELLED'] },
        },
        orderBy: { id: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          category: true,
          date: true,
          status: true,
          isAnonymous: true,
          user: {
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

      // Hitung konsultasi yang PENDING / SCHEDULED / ONGOING
      prisma.consultation.count({
        where: {
          psychologistId: session.user.id,
          status: { in: ['SCHEDULED', 'ONGOING'] },
        },
      }),

      // Hitung konsultasi yang COMPLETED / CANCELLED
      prisma.consultation.count({
        where: {
          psychologistId: session.user.id,
          status: { in: ['COMPLETED', 'CANCELLED'] },
        },
      }),

      // --- LOGIKA EARNINGS BARU ---
      // 1. Total Platform Donations (PAID) bulan ini
      prisma.donation.aggregate({
        _sum: { amount: true },
        where: {
          donationType: 'PLATFORM',
          paymentStatus: 'PAID',
          timestamp: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      // 2. Total Semua Konsultasi COMPLETED bulan ini (semua psikolog)
      prisma.consultation.count({
        where: {
          status: 'COMPLETED',
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      // 3. Total Konsultasi COMPLETED psikolog ini bulan ini
      prisma.consultation.count({
        where: {
          psychologistId: session.user.id,
          status: 'COMPLETED',
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    upcomingConsultations = upcoming as unknown as DashboardConsultation[];
    completedConsultations = completed as unknown as DashboardConsultation[];
    totalConsCount = consCount;
    pendingConsCount = pendingCount;
    completedConsCount = completedCount;

    // Kalkulasi Earnings
    const totalPlatformAmount = Number(
      monthlyPlatformDonations._sum.amount || 0,
    );
    const psychologistPool = totalPlatformAmount * 0.9;
    monthlyEarnings =
      totalMonthlyCons > 0
        ? (psychologistPool / totalMonthlyCons) * myMonthlyCons
        : 0;
  } catch (e) {
    console.error('Failed to fetch psychologist dashboard data:', e);
  }

  const displayName = currentUser?.name || session.user.name || 'Psychologist';

  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-[#8ea087]">Loading psychologist panel...</div>
      }
    >
      <PsychologistDashboardContent
        upcomingConsultations={upcomingConsultations}
        completedConsultations={completedConsultations}
        displayName={displayName}
        totalConsultationsCount={totalConsCount}
        pendingConsultationsCount={pendingConsCount}
        completedConsultationsCount={completedConsCount}
        monthlyEarnings={monthlyEarnings}
      />
    </React.Suspense>
  );
}
