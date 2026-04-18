import { prisma } from '@/lib/prisma';

import type {
  CreateReportRepositoryInput,
  ReportEvidenceInput,
} from './report.type';

export const createReport = async (reportData: CreateReportRepositoryInput) => {
  return prisma.report.create({
    data: reportData,
    include: {
      evidences: true,
    },
  });
};

export const addReportEvidence = async (
  reportId: number,
  evidence: ReportEvidenceInput,
) => {
  return prisma.reportEvidence.create({
    data: {
      reportId,
      ...evidence,
    },
  });
};

export const addReportEvidences = async (
  reportId: number,
  evidences: ReportEvidenceInput[],
) => {
  return prisma.reportEvidence.createMany({
    data: evidences.map((evidence) => ({
      reportId,
      ...evidence,
    })),
  });
};
