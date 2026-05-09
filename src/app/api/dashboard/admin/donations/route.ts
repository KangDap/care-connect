import { ok } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

import { requireAdminSession } from '../_shared';

export async function GET(req: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const url = new URL(req.url);
  const pageParam = url.searchParams.get('page');

  const page = Math.max(1, Number(pageParam) || 1);
  const perPage = 15;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todayPaid,
    monthPaid,
    allTimePaid,
    allTimePaidCount,
    donations,
    totalCount,
    byStatus,
  ] = await Promise.all([
    prisma.donation.aggregate({
      _sum: { amount: true },
      where: { paymentStatus: 'PAID', timestamp: { gte: startOfToday } },
    }),
    prisma.donation.aggregate({
      _sum: { amount: true },
      where: { paymentStatus: 'PAID', timestamp: { gte: startOfMonth } },
    }),
    prisma.donation.aggregate({
      _sum: { amount: true },
      where: { paymentStatus: 'PAID' },
    }),
    prisma.donation.count({ where: { paymentStatus: 'PAID' } }),
    prisma.donation.findMany({
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        amount: true,
        paymentMethod: true,
        paymentStatus: true,
        donationType: true,
        timestamp: true,
        user: { select: { name: true, email: true } },
        report: { select: { id: true, title: true } },
      },
    }),
    prisma.donation.count(),
    prisma.donation.groupBy({ by: ['paymentStatus'], _count: { id: true } }),
  ]);

  const statusMap = Object.fromEntries(
    byStatus.map((s) => [s.paymentStatus, s._count.id]),
  );

  const formattedDonations = donations.map((donation) => ({
    id: donation.id,
    amount: Number(donation.amount),
    paymentMethod: donation.paymentMethod,
    paymentStatus: donation.paymentStatus,
    donationType: donation.donationType,
    timestamp: donation.timestamp.toISOString(),
    user: donation.user,
    report: donation.report,
  }));

  return ok({
    summary: {
      todayAmount: Number(todayPaid._sum.amount || 0),
      monthAmount: Number(monthPaid._sum.amount || 0),
      allTimeAmount: Number(allTimePaid._sum.amount || 0),
      allTimeCount: allTimePaidCount,
    },
    statusCounts: statusMap,
    donations: formattedDonations,
    totalCount,
    page,
    perPage,
  });
}

export async function PATCH(req: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const { id, paymentStatus } = await req.json();

    if (!id || !paymentStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
        },
      );
    }

    const updated = await prisma.donation.update({
      where: { id },
      data: { paymentStatus },
    });

    return ok(updated);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to update donation' }),
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(req: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
      });
    }

    await prisma.donation.delete({
      where: { id },
    });

    return ok({ success: true });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to delete donation' }),
      {
        status: 500,
      },
    );
  }
}
