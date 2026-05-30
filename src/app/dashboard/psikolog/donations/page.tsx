import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import PsychologistDonationsContent from './PsychologistDonationsContent';

export default async function PsychologistDonationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'PSYCHOLOGIST') {
    redirect('/dashboard/user');
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Fetch Current Month Stats
  const [monthlyPlatformDonations, totalMonthlyCons, myMonthlyCons] =
    await Promise.all([
      prisma.donation.aggregate({
        _sum: { amount: true },
        where: {
          donationType: 'PLATFORM',
          paymentStatus: 'PAID',
          timestamp: { gte: startOfMonth },
        },
      }),
      prisma.consultation.count({
        where: {
          status: 'COMPLETED',
          date: { gte: startOfMonth },
        },
      }),
      prisma.consultation.count({
        where: {
          psychologistId: session.user.id,
          status: 'COMPLETED',
          date: { gte: startOfMonth },
        },
      }),
    ]);

  const currentMonthStats = {
    totalPool: Number(monthlyPlatformDonations._sum.amount || 0),
    yourSessions: myMonthlyCons,
    totalPlatformSessions: totalMonthlyCons || 1, // Avoid division by zero
    allocationPercentage: 0.9,
  };

  // 2. Fetch History (Last 3 Months)
  const getMonthHistory = async (offset: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const [pool, totalCons, myCons] = await Promise.all([
      prisma.donation.aggregate({
        _sum: { amount: true },
        where: {
          donationType: 'PLATFORM',
          paymentStatus: 'PAID',
          timestamp: { gte: start, lte: end },
        },
      }),
      prisma.consultation.count({
        where: {
          status: 'COMPLETED',
          date: { gte: start, lte: end },
        },
      }),
      prisma.consultation.count({
        where: {
          psychologistId: session.user.id,
          status: 'COMPLETED',
          date: { gte: start, lte: end },
        },
      }),
    ]);

    const platformPool = Number(pool._sum.amount || 0);
    const incentive =
      totalCons > 0 ? ((platformPool * 0.9) / totalCons) * myCons : 0;

    return {
      id: offset,
      period: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      sessions: myCons,
      platformPool,
      incentive,
    };
  };

  const donationHistory = await Promise.all([
    getMonthHistory(0),
    getMonthHistory(1),
    getMonthHistory(2),
    getMonthHistory(3),
  ]);

  // Filter out months with no activity to keep the table clean
  const activeHistory = donationHistory.filter(
    (h) => h.sessions > 0 || h.platformPool > 0,
  );

  return (
    <main>
      <PsychologistDonationsContent
        stats={currentMonthStats}
        history={activeHistory}
      />
    </main>
  );
}
