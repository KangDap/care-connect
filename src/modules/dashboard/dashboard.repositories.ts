import { prisma } from '@/lib/prisma';

import type { PsychologistDashboardStats } from './dashboard.types';

export const getPsychologistDashboardStats = async (
  psychologistId: string,
): Promise<PsychologistDashboardStats> => {
  // 1. Pending consultations
  const pendingConsultationCount = await prisma.consultation.count({
    where: { psychologistId, status: 'SCHEDULED' },
  });

  // 2. Total consultations
  const totalConsultationCount = await prisma.consultation.count({
    where: { psychologistId },
  });

  // 3. Completed consultations
  const completedConsultationCount = await prisma.consultation.count({
    where: { psychologistId, status: 'COMPLETED' },
  });

  // 4. Recent consultations (SCHEDULED)
  const recentConsultations = await prisma.consultation.findMany({
    where: { psychologistId, status: 'SCHEDULED' },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    take: 5,
  });

  // 5. Report status (COMPLETED)
  const completedConsultations = await prisma.consultation.findMany({
    where: { psychologistId, status: 'COMPLETED' },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: [{ date: 'desc' }, { time: 'desc' }],
    take: 5,
  });

  // 6. Monthly Earnings Calculation
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total Platform Donations (PAID) this month
  const monthlyPlatformDonations = await prisma.donation.aggregate({
    _sum: { amount: true },
    where: {
      donationType: 'PLATFORM',
      paymentStatus: 'PAID',
      timestamp: { gte: startOfMonth },
    },
  });

  const totalPlatformAmount = Number(monthlyPlatformDonations._sum.amount || 0);
  const psychologistPool = totalPlatformAmount * 0.9;

  // Total Completed Consultations this month (All psychologists)
  const totalMonthlyConsultations = await prisma.consultation.count({
    where: {
      status: 'COMPLETED',
      date: { gte: startOfMonth },
    },
  });

  // This psychologist's Completed Consultations this month
  const psychologistMonthlyConsultations = await prisma.consultation.count({
    where: {
      psychologistId,
      status: 'COMPLETED',
      date: { gte: startOfMonth },
    },
  });

  // Share = (Pool / Total Consultations) * My Consultations
  const monthlyEarnings =
    totalMonthlyConsultations > 0
      ? (psychologistPool / totalMonthlyConsultations) *
        psychologistMonthlyConsultations
      : 0;

  return {
    pendingConsultationCount,
    totalConsultationCount,
    completedConsultationCount,
    monthlyEarnings,
    recentConsultations,
    completedConsultations,
  };
};
