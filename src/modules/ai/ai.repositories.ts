import { prisma } from '@/lib/prisma';

export class AIRepository {
  static async getReportsByIds(reportIds: (string | number)[]) {
    const numericIds = reportIds
      .map((id) => (typeof id === 'number' ? id : parseInt(String(id), 10)))
      .filter((id) => !isNaN(id));

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

  static async getConsultationsByIds(consultationIds: (string | number)[]) {
    const numericIds = consultationIds
      .map((id) => (typeof id === 'number' ? id : parseInt(String(id), 10)))
      .filter((id) => !isNaN(id));

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

  static async getRecentReports(limit = 10) {
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

  static async getReportsByStartDate(startDate: Date | null) {
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

  static async getConsultationsByStartDate(startDate: Date | null) {
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
