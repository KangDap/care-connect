import { prisma } from '@/lib/prisma';

import { ReportClient } from './ReportClient';

type PageProps = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const { status: filterStatus, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const perPage = 10;

  const where =
    filterStatus && filterStatus !== 'ALL'
      ? { status: filterStatus as never }
      : {};

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
        evidences: { select: { id: true }, take: 1 },
        donations: {
          where: { paymentStatus: 'PAID' },
          select: { amount: true },
        },
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

  const formattedReports = reports.map((r) => {
    const donationTotal = r.donations.reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );

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

  const activeTab = filterStatus || 'ALL';

  return (
    <ReportClient
      reports={formattedReports}
      activeTab={activeTab}
      tabs={tabs}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
    />
  );
}
