import { ReportStatus as ReportStatusEnum } from '@/generated/prisma/enums';
import type { ReportStatus } from '@/generated/prisma/enums';
import { fail, ok } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

import { requireAdminSession } from '../_shared';

const isReportStatus = (value: unknown): value is ReportStatus =>
  typeof value === 'string' &&
  Object.values(ReportStatusEnum).includes(value as ReportStatus);

const parsePositiveInt = (value: unknown) => {
  const num = typeof value === 'string' ? Number(value) : Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
};

export async function GET(req: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const url = new URL(req.url);
  const statusParam = url.searchParams.get('status');
  const pageParam = url.searchParams.get('page');

  const page = Math.max(1, Number(pageParam) || 1);
  const perPage = 10;

  let statusFilter: ReportStatus | undefined;

  if (statusParam && statusParam !== 'ALL') {
    if (!isReportStatus(statusParam)) {
      return fail('BAD_REQUEST', 'Invalid status filter', 400);
    }
    statusFilter = statusParam;
  }

  const where = statusFilter ? { status: statusFilter } : {};

  const [reports, totalCount, statusCounts] = await Promise.all([
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
    prisma.report.groupBy({ by: ['status'], _count: { id: true } }),
  ]);

  const statusCountMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count.id]),
  );

  const formattedReports = reports.map((report) => {
    const donationTotal = report.donations.reduce(
      (sum, donation) => sum + Number(donation.amount),
      0,
    );

    return {
      id: report.id,
      title: report.title,
      category: report.category,
      status: report.status,
      isAnonymous: report.isAnonymous,
      province: report.province,
      city: report.city,
      incidentDate: report.incidentDate.toISOString(),
      createdAt: report.createdAt.toISOString(),
      description: report.description,
      user: report.user,
      hasEvidence: report.evidences.length > 0,
      donationTotal,
    };
  });

  return ok({
    reports: formattedReports,
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

  let body: { id?: number; status?: string };

  try {
    body = await req.json();
  } catch {
    return fail('BAD_REQUEST', 'Invalid JSON body', 400);
  }

  const id = parsePositiveInt(body.id);
  const status = body.status;

  if (!id) {
    return fail('BAD_REQUEST', 'id must be a positive integer', 400);
  }

  if (!status || !isReportStatus(status)) {
    return fail('BAD_REQUEST', 'Invalid report status', 400);
  }

  const existing = await prisma.report.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return fail('NOT_FOUND', 'Report not found', 404);
  }

  const updated = await prisma.report.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  });

  return ok(updated);
}

export async function DELETE(req: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  let body: { id?: number } | null = null;

  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const url = new URL(req.url);
  const idParam = url.searchParams.get('id');
  const id = parsePositiveInt(body?.id ?? idParam);

  if (!id) {
    return fail('BAD_REQUEST', 'id must be a positive integer', 400);
  }

  const existing = await prisma.report.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return fail('NOT_FOUND', 'Report not found', 404);
  }

  await prisma.report.delete({ where: { id } });

  return ok({ id });
}
