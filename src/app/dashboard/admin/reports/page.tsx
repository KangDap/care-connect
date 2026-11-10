import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

import { ReportClient } from './ReportClient';

type PageProps = {
  searchParams: Promise<{ status?: string; page?: string; search?: string }>;
};

const paymentEnabled = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === 'true';

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const { status: filterStatus, page: pageStr, search } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const perPage = 10;

  const where: Prisma.ReportWhereInput = {};
  if (filterStatus && filterStatus !== 'ALL') {
    where.status = filterStatus as never;
  }

  if (search && search.trim()) {
    const trimmed = search.trim();
    where.OR = [
      { title: { contains: trimmed, mode: 'insensitive' } },
      { description: { contains: trimmed, mode: 'insensitive' } },
      { province: { contains: trimmed, mode: 'insensitive' } },
      { city: { contains: trimmed, mode: 'insensitive' } },
      { district: { contains: trimmed, mode: 'insensitive' } },
      { user: { name: { contains: trimmed, mode: 'insensitive' } } },
      { user: { email: { contains: trimmed, mode: 'insensitive' } } },
    ];
  }

  const [reports, totalCount] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        isAnonymous: true,
        province: true,
        city: true,
        incidentDate: true,
        createdAt: true,
        description: true,
        user: { select: { name: true, email: true } },
        evidences: { select: { fileUrl: true }, take: 1 },
        ...(paymentEnabled
          ? {
              donations: {
                where: { paymentStatus: 'PAID' },
                select: { amount: true },
              },
            }
          : {}),
      },
    }),
    prisma.report.count({ where }),
  ]);

  const statusCounts = await prisma.report.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  const countMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count.id]),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalAll = Object.values(countMap).reduce((a: any, b: any) => a + b, 0);

  const totalPages = Math.ceil(totalCount / perPage);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedReports = reports.map((r: any) => {
    const donationTotal =
      paymentEnabled && r.donations
        ? r.donations.reduce(
            (sum: number, d: { amount: number }) => sum + Number(d.amount),
            0,
          )
        : 0;

    return {
      id: r.id,
      title: r.title,
      category: r.category,
      status: r.status,
      isAnonymous: r.isAnonymous,
      province: r.province,
      city: r.city,
      incidentDate: r.incidentDate.toISOString(),
      createdAt: r.createdAt.toISOString(),
      description: r.description,
      user: r.user,
      hasEvidence: r.evidences.length > 0,
      evidences: r.evidences,
      donationTotal,
    };
  });

  const tabs = [
    { label: 'All', value: 'ALL', count: totalAll },
    { label: 'Pending', value: 'PENDING', count: countMap['PENDING'] || 0 },
    { label: 'Reviewed', value: 'REVIEWED', count: countMap['REVIEWED'] || 0 },
    { label: 'Resolved', value: 'RESOLVED', count: countMap['RESOLVED'] || 0 },
    { label: 'Rejected', value: 'REJECTED', count: countMap['REJECTED'] || 0 },
  ];

  return (
    <ReportClient
      reports={formattedReports}
      activeTab={filterStatus || 'ALL'}
      tabs={tabs}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
    />
  );
}
