import { Prisma } from '@/generated/prisma/client';
import { PaymentStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

import { DonationClient } from './DonationClient';

export default async function AdminDonationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    year?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const currentMonth = Number(params.month) || now.getMonth() + 1;
  const currentYear = Number(params.year) || now.getFullYear();
  const status = params.status || 'ALL';
  const page = Number(params.page) || 1;
  const perPage = 10;

  const startDate = new Date(currentYear, currentMonth - 1, 1);
  const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  const whereDonation: Prisma.DonationWhereInput = {};
  if (status !== 'ALL') {
    whereDonation.paymentStatus = status as PaymentStatus;
  }

  const [
    donations,
    totalFilteredCount,
    platformDonations,
    allTimePlatformDonations,
    psychologists,
    totalCompletedConsultations,
    allTimeTotalSessions,
    allDonationsCount,
    paidDonationsCount,
    pendingDonationsCount,
    failedDonationsCount,
    expiredDonationsCount,
    refundedDonationsCount,
    cancelledDonationsCount,
  ] = await Promise.all([
    prisma.donation.findMany({
      where: whereDonation,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        reportId: true,
        userId: true,
        amount: true,
        paymentStatus: true,
        timestamp: true,
        report: {
          select: { title: true, description: true },
        },
        user: {
          select: { name: true },
        },
      },
    }),
    prisma.donation.count({ where: whereDonation }),
    prisma.donation.aggregate({
      _sum: { amount: true },
      where: {
        donationType: 'PLATFORM',
        paymentStatus: 'PAID',
        timestamp: { gte: startDate, lte: endDate },
      },
    }),
    prisma.donation.aggregate({
      _sum: { amount: true },
      where: { donationType: 'PLATFORM', paymentStatus: 'PAID' },
    }),
    prisma.user.findMany({
      where: { role: 'PSYCHOLOGIST' },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            consultationsAsPsych: {
              where: {
                status: 'COMPLETED',
                date: { gte: startDate, lte: endDate },
              },
            },
          },
        },
      },
    }),
    prisma.consultation.count({
      where: {
        status: 'COMPLETED',
        date: { gte: startDate, lte: endDate },
      },
    }),
    prisma.consultation.count({
      where: { status: 'COMPLETED' },
    }),
    prisma.donation.count(),
    prisma.donation.count({ where: { paymentStatus: 'PAID' } }),
    prisma.donation.count({ where: { paymentStatus: 'PENDING' } }),
    prisma.donation.count({ where: { paymentStatus: 'FAILED' } }),
    prisma.donation.count({ where: { paymentStatus: 'EXPIRED' } }),
    prisma.donation.count({ where: { paymentStatus: 'REFUNDED' } }),
    prisma.donation.count({ where: { paymentStatus: 'CANCELLED' } }),
  ]);

  const totalPages = Math.ceil(totalFilteredCount / perPage);
  const totalPlatformAmount = Number(platformDonations._sum.amount || 0);
  const totalAllTimePlatformAmount = Number(
    allTimePlatformDonations._sum.amount || 0,
  );

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <DonationClient
        donations={donations.map((d) => ({
          id: d.id,
          reportId: d.reportId || 0,
          userName: d.user?.name || 'Anonymous',
          amount: Number(d.amount),
          message: '',
          paymentStatus: d.paymentStatus,
          createdAt: d.timestamp.toISOString(),
          report: d.report || { title: 'Platform Donation', description: '' },
        }))}
        summary={{
          platformTotal: totalPlatformAmount,
          psychologistPool: totalPlatformAmount * 0.9,
          totalSessions: totalCompletedConsultations,
          allTimeTotal: totalAllTimePlatformAmount,
          allTimeSessions: allTimeTotalSessions,
        }}
        psychologistBreakdown={psychologists.map((p) => {
          const sessions = p._count.consultationsAsPsych;
          const share =
            totalCompletedConsultations > 0
              ? (sessions / totalCompletedConsultations) *
                (totalPlatformAmount * 0.9)
              : 0;
          return {
            id: p.id,
            name: p.name,
            sessions,
            earnings: share,
          };
        })}
        currentMonth={currentMonth}
        currentYear={currentYear}
        currentStatus={status}
        page={page}
        totalPages={totalPages}
        perPage={perPage}
        totalCount={totalFilteredCount}
        counts={{
          all: allDonationsCount,
          paid: paidDonationsCount,
          pending: pendingDonationsCount,
          failed: failedDonationsCount,
          expired: expiredDonationsCount,
          refunded: refundedDonationsCount,
          cancelled: cancelledDonationsCount,
        }}
      />
    </div>
  );
}
