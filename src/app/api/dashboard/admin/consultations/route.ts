import { ok } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

import { requireAdminSession } from '../_shared';

export async function GET(req: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const url = new URL(req.url);
  const tab = url.searchParams.get('tab') ?? 'active';
  const pageParam = url.searchParams.get('page');

  const page = Math.max(1, Number(pageParam) || 1);
  const perPage = 10;
  const isActive = tab !== 'history';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = isActive
    ? { status: { in: ['SCHEDULED', 'ONGOING'] } }
    : { status: { in: ['COMPLETED', 'CANCELLED'] } };

  const [consultations, totalCount, statusCounts] = await Promise.all([
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
  ]);

  const statusCountMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count.id]),
  );

  const formattedConsultations = consultations.map((consultation) => ({
    id: consultation.id,
    title: consultation.title,
    category: consultation.category,
    status: consultation.status,
    date: consultation.date.toISOString(),
    isAnonymous: consultation.isAnonymous,
    user: consultation.user,
    psychologist: consultation.psychologist,
  }));

  return ok({
    consultations: formattedConsultations,
    totalCount,
    page,
    perPage,
    totalPages: Math.ceil(totalCount / perPage),
    statusCounts: statusCountMap,
  });
}

export async function PATCH(req: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return Response.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const updated = await prisma.consultation.update({
      where: { id: Number(id) },
      data: { status },
    });

    return ok(updated);
  } catch (error) {
    console.error('Update consultation status error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Missing id' }, { status: 400 });
    }

    await prisma.consultation.delete({
      where: { id: Number(id) },
    });

    return ok({ success: true });
  } catch (error) {
    console.error('Delete consultation error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
