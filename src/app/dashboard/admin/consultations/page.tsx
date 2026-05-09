import { prisma } from '@/lib/prisma';

import { ConsultationsClient } from './ConsultationsClient';

type PageProps = {
  searchParams: Promise<{ tab?: string; page?: string }>;
};

export default async function AdminConsultationsPage({
  searchParams,
}: PageProps) {
  const { tab = 'all', page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const perPage = 10;

  const where =
    tab === 'active'
      ? { status: { in: ['SCHEDULED', 'ONGOING'] as never[] } }
      : tab === 'history'
        ? { status: { in: ['COMPLETED', 'CANCELLED'] as never[] } }
        : {};

  const [consultations, totalCount, statusCounts, absoluteTotalCount] =
    await Promise.all([
      prisma.consultation.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          date: true,
          isAnonymous: true,
          user: { select: { name: true, email: true } },
          psychologist: { select: { name: true } },
        },
      }),
      prisma.consultation.count({ where }),
      prisma.consultation.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.consultation.count(),
    ]);

  const countMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count.id]),
  );
  const activeCount = (countMap['SCHEDULED'] || 0) + (countMap['ONGOING'] || 0);
  const historyCount =
    (countMap['COMPLETED'] || 0) + (countMap['CANCELLED'] || 0);
  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <ConsultationsClient
      consultations={consultations}
      totalCount={totalCount}
      absoluteTotalCount={absoluteTotalCount}
      activeCount={activeCount}
      historyCount={historyCount}
      statusCounts={countMap}
      tab={tab}
      page={page}
      totalPages={totalPages}
      perPage={perPage}
    />
  );
}
