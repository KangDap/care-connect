import type { Prisma } from '@/generated/prisma/client';
import { DonationType, PaymentStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

import type {
  CreateDistributionInput,
  DistributionFilterQuery,
} from './donation-distribution.types';

export const getPlatformDonationsSum = async () => {
  const result = await prisma.donation.aggregate({
    _sum: { amount: true },
    _count: { id: true },
    where: {
      donationType: DonationType.PLATFORM,
      paymentStatus: PaymentStatus.PAID,
    },
  });

  return {
    amount: Number(result._sum.amount || 0),
    count: result._count.id,
  };
};

export const getReportDonationsSum = async () => {
  const result = await prisma.donation.aggregate({
    _sum: { amount: true },
    _count: { id: true },
    where: {
      donationType: DonationType.REPORT,
      paymentStatus: PaymentStatus.PAID,
    },
  });

  return {
    amount: Number(result._sum.amount || 0),
    count: result._count.id,
  };
};

export const getPlatformDistributionsSum = async () => {
  const result = await prisma.donationDistribution.aggregate({
    _sum: { amount: true },
    _count: { id: true },
    where: {
      targetType: DonationType.PLATFORM,
    },
  });

  return {
    amount: Number(result._sum.amount || 0),
    count: result._count.id,
  };
};

export const getReportDistributionsSum = async () => {
  const result = await prisma.donationDistribution.aggregate({
    _sum: { amount: true },
    _count: { id: true },
    where: {
      targetType: DonationType.REPORT,
    },
  });

  return {
    amount: Number(result._sum.amount || 0),
    count: result._count.id,
  };
};

export const getReportFinances = async (reportId: number) => {
  const [donations, distributions] = await Promise.all([
    prisma.donation.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        reportId,
        paymentStatus: PaymentStatus.PAID,
      },
    }),
    prisma.donationDistribution.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        reportId,
        targetType: DonationType.REPORT,
      },
    }),
  ]);

  const totalCollected = Number(donations._sum.amount || 0);
  const totalDistributed = Number(distributions._sum.amount || 0);

  return {
    totalCollected,
    totalDistributed,
    remainingBalance: Math.max(0, totalCollected - totalDistributed),
    donationCount: donations._count.id,
    distributionCount: distributions._count.id,
  };
};

export const findReportById = async (reportId: number) => {
  return prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      title: true,
      category: true,
      incidentDate: true,
    },
  });
};

export const getReportsWithActivity = async (search?: string) => {
  const where: Prisma.ReportWhereInput = {};

  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  const reports = await prisma.report.findMany({
    where,
    select: {
      id: true,
      title: true,
      category: true,
      incidentDate: true,
      _count: {
        select: {
          donations: { where: { paymentStatus: PaymentStatus.PAID } },
          distributions: true,
        },
      },
    },
    orderBy: { id: 'desc' },
  });

  const [donationsByReport, distributionsByReport] = await Promise.all([
    prisma.donation.groupBy({
      by: ['reportId'],
      where: {
        reportId: { not: null },
        paymentStatus: PaymentStatus.PAID,
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.donationDistribution.groupBy({
      by: ['reportId'],
      where: {
        targetType: DonationType.REPORT,
        reportId: { not: null },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const donationMap = new Map<number, { amount: number; count: number }>();
  for (const d of donationsByReport) {
    if (d.reportId !== null) {
      donationMap.set(d.reportId, {
        amount: Number(d._sum.amount || 0),
        count: d._count.id,
      });
    }
  }

  const distributionMap = new Map<number, { amount: number; count: number }>();
  for (const dist of distributionsByReport) {
    if (dist.reportId !== null) {
      distributionMap.set(dist.reportId, {
        amount: Number(dist._sum.amount || 0),
        count: dist._count.id,
      });
    }
  }

  return reports.map((r) => {
    const don = donationMap.get(r.id) || { amount: 0, count: 0 };
    const dist = distributionMap.get(r.id) || { amount: 0, count: 0 };
    return {
      report: r,
      totalCollected: don.amount,
      totalDistributed: dist.amount,
      remainingBalance: Math.max(0, don.amount - dist.amount),
      donationCount: don.count,
      distributionCount: dist.count,
    };
  });
};

export const createDistributionRecord = async (
  input: CreateDistributionInput & { createdById: string },
) => {
  return prisma.donationDistribution.create({
    data: {
      targetType: input.targetType,
      reportId:
        input.targetType === DonationType.REPORT ? input.reportId : null,
      amount: input.amount,
      recipient: input.recipient,
      notes: input.notes || null,
      distributedAt: input.distributedAt
        ? new Date(input.distributedAt)
        : new Date(),
      createdById: input.createdById,
    },
    include: {
      report: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const findDistributions = async (query: DistributionFilterQuery) => {
  const where: Prisma.DonationDistributionWhereInput = {};

  if (query.targetType && query.targetType !== 'ALL') {
    where.targetType = query.targetType;
  }

  if (query.reportId) {
    where.reportId = query.reportId;
  }

  if (query.startDate || query.endDate) {
    where.distributedAt = {};
    if (query.startDate) {
      where.distributedAt.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      where.distributedAt.lte = new Date(query.endDate);
    }
  }

  if (query.search) {
    where.OR = [
      { recipient: { contains: query.search, mode: 'insensitive' } },
      { notes: { contains: query.search, mode: 'insensitive' } },
      { report: { title: { contains: query.search, mode: 'insensitive' } } },
    ];
  }

  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  const [records, totalCount] = await Promise.all([
    prisma.donationDistribution.findMany({
      where,
      orderBy: { distributedAt: 'desc' },
      skip,
      take: limit,
      include: {
        report: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.donationDistribution.count({ where }),
  ]);

  return { records, totalCount, page, limit };
};

export const findDistributionById = async (id: number) => {
  return prisma.donationDistribution.findUnique({
    where: { id },
    include: {
      report: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const getTargetDistributions = async (
  targetType: DonationType,
  reportId?: number,
  limit = 20,
) => {
  const where: Prisma.DonationDistributionWhereInput = {
    targetType,
  };

  if (targetType === DonationType.REPORT && reportId) {
    where.reportId = reportId;
  }

  return prisma.donationDistribution.findMany({
    where,
    orderBy: { distributedAt: 'desc' },
    take: limit,
    include: {
      report: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const getTargetDonations = async (
  targetType: DonationType,
  reportId?: number,
  limit = 20,
) => {
  const where: Prisma.DonationWhereInput = {
    donationType: targetType,
    paymentStatus: PaymentStatus.PAID,
  };

  if (targetType === DonationType.REPORT && reportId) {
    where.reportId = reportId;
  }

  return prisma.donation.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit,
    select: {
      id: true,
      amount: true,
      timestamp: true,
      paymentStatus: true,
      paymentMethod: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
};

export const getPsychologistsList = async () => {
  return prisma.user.findMany({
    where: { role: 'PSYCHOLOGIST' },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
};

export const getCompletedConsultationsInPeriod = async (
  start: Date,
  end?: Date,
) => {
  const where: Prisma.ConsultationWhereInput = {
    status: 'COMPLETED',
    date: {
      gte: start,
      ...(end ? { lte: end } : {}),
    },
  };

  return prisma.consultation.groupBy({
    by: ['psychologistId'],
    where,
    _count: { id: true },
  });
};

export const getPlatformDonationsInPeriod = async (start: Date, end?: Date) => {
  const where: Prisma.DonationWhereInput = {
    donationType: DonationType.PLATFORM,
    paymentStatus: PaymentStatus.PAID,
    timestamp: {
      gte: start,
      ...(end ? { lte: end } : {}),
    },
  };

  const result = await prisma.donation.aggregate({
    _sum: { amount: true },
    where,
  });

  return Number(result._sum.amount || 0);
};

export const getCompletedConsultationsTotalInPeriod = async (
  start: Date,
  end?: Date,
) => {
  const where: Prisma.ConsultationWhereInput = {
    status: 'COMPLETED',
    date: {
      gte: start,
      ...(end ? { lte: end } : {}),
    },
  };

  return prisma.consultation.count({ where });
};
