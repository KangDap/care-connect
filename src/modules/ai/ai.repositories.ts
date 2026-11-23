import { prisma } from '@/lib/prisma';

export class AIRepository {
  static getReportsByIds(reportIds: (string | number)[]) {
    const numericIds = reportIds
      .map((id) =>
        typeof id === 'number' ? id : Number.parseInt(String(id), 10),
      )
      .filter((id) => !Number.isNaN(id));

    return prisma.report.findMany({
      where: {
        id: { in: numericIds },
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
      },
    });
  }

  static getConsultationsByIds(consultationIds: (string | number)[]) {
    const numericIds = consultationIds
      .map((id) =>
        typeof id === 'number' ? id : Number.parseInt(String(id), 10),
      )
      .filter((id) => !Number.isNaN(id));

    return prisma.consultation.findMany({
      where: {
        id: { in: numericIds },
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
      },
    });
  }

  static getRecentReports(limit = 10) {
    return prisma.report.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
      },
    });
  }

  static getReportsByStartDate(startDate: Date | null) {
    return prisma.report.findMany({
      where: startDate
        ? {
            createdAt: { gte: startDate },
          }
        : undefined,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static getConsultationsByStartDate(startDate: Date | null) {
    return prisma.consultation.findMany({
      where: startDate
        ? {
            createdAt: { gte: startDate },
          }
        : undefined,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        date: true,
        createdAt: true,
      },
      orderBy: { date: 'desc' },
    });
  }
}
