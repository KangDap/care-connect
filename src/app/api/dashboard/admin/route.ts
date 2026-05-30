import { UserRole as UserRoleEnum } from '@/generated/prisma/enums';
import type { UserRole } from '@/generated/prisma/enums';
import { fail, ok } from '@/lib/api-response';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import type { AdminDashboardData } from '@/modules/dashboard/dashboard.types';
import { headers } from 'next/headers';

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }

    const sessionRole = session.user.role;
    let role: UserRole | undefined = undefined;

    if (
      sessionRole &&
      Object.values(UserRoleEnum).includes(sessionRole as UserRole)
    ) {
      role = sessionRole as UserRole;
    }

    if (!role) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      const userRole = user?.role;

      if (
        userRole &&
        Object.values(UserRoleEnum).includes(userRole as UserRole)
      ) {
        role = userRole as UserRole;
      }
    }

    if (role !== 'ADMIN') {
      return fail('FORBIDDEN', 'Access denied. Admin role required.', 403);
    }

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const days = getLast7Days();

    const [
      totalReports,
      pendingReports,
      reportsByStatus,
      totalConsultations,
      activeConsultations,
      consultationsByStatus,
      totalDonationsCount,
      allTimePaid,
      todayPaid,
      monthPaid,
      recentDonations,
      totalChats,
      donations7Days,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.consultation.count(),
      prisma.consultation.count({
        where: { status: { in: ['SCHEDULED', 'ONGOING'] } },
      }),
      prisma.consultation.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.donation.count({ where: { paymentStatus: 'PAID' } }),
      prisma.donation.aggregate({
        _sum: { amount: true },
        where: { paymentStatus: 'PAID' },
      }),
      prisma.donation.aggregate({
        _sum: { amount: true },
        where: { paymentStatus: 'PAID', timestamp: { gte: startOfToday } },
      }),
      prisma.donation.aggregate({
        _sum: { amount: true },
        where: { paymentStatus: 'PAID', timestamp: { gte: startOfMonth } },
      }),
      prisma.donation.findMany({
        where: { paymentStatus: 'PAID' },
        take: 5,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          timestamp: true,
          donationType: true,
          user: { select: { name: true, email: true } },
          report: { select: { title: true } },
        },
      }),
      prisma.chat.count(),
      prisma.donation.findMany({
        where: {
          paymentStatus: 'PAID',
          timestamp: { gte: days[0] },
        },
        select: { amount: true, timestamp: true },
      }),
    ]);

    const donationChartData = days.map((day) => {
      const label = day.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
      });
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const dayDonations = donations7Days.filter(
        (d) => d.timestamp >= day && d.timestamp < nextDay,
      );

      return {
        date: label,
        total: dayDonations.reduce((sum, d) => sum + Number(d.amount), 0),
        count: dayDonations.length,
      };
    });

    const reportsChartData = reportsByStatus.map((r) => ({
      status: r.status.charAt(0) + r.status.slice(1).toLowerCase(),
      count: r._count.id,
    }));

    const consultChartData = consultationsByStatus.map((c) => ({
      status: c.status.charAt(0) + c.status.slice(1).toLowerCase(),
      count: c._count.id,
    }));

    const donationTotals = {
      allTime: Number(allTimePaid._sum.amount || 0),
      today: Number(todayPaid._sum.amount || 0),
      month: Number(monthPaid._sum.amount || 0),
    };

    const normalizedRecentDonations = recentDonations.map((d) => ({
      id: d.id,
      amount: Number(d.amount),
      paymentMethod: d.paymentMethod,
      timestamp: d.timestamp.toISOString(),
      donationType: d.donationType,
      user: d.user,
      report: d.report,
    }));

    const payload: AdminDashboardData = {
      totalReports,
      pendingReports,
      reportsChartData,
      totalConsultations,
      activeConsultations,
      consultChartData,
      totalDonationsCount,
      donationTotals,
      totalChats,
      donationChartData,
      recentDonations: normalizedRecentDonations,
    };

    return ok(payload);
  } catch (error) {
    console.error('DASHBOARD ADMIN GET ROUTE ERROR:', error);
    return fail('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
  }
}
