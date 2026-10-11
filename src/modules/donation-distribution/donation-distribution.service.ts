import { DonationType } from '@/generated/prisma/enums';
import { ApiError, Errors } from '@/lib/error';

import {
  createDistributionRecord,
  findDistributionById,
  findDistributions,
  findReportById,
  getCompletedConsultationsInPeriod,
  getCompletedConsultationsTotalInPeriod,
  getPlatformDistributionsSum,
  getPlatformDonationsInPeriod,
  getPlatformDonationsSum,
  getPsychologistsList,
  getReportDistributionsSum,
  getReportDonationsSum,
  getReportFinances,
  getReportsWithActivity,
  getTargetDistributions,
  getTargetDonations,
} from './donation-distribution.repositories';
import { DonationDistributionSchema } from './donation-distribution.schema';
import type {
  CreateDistributionInput,
  DistributionFilterQuery,
  DonationDistributionGroup,
  DonationDistributionGroupDetail,
  DonationDistributionRecord,
  DonationDistributionSummary,
  PsychologistPayoutSummary,
} from './donation-distribution.types';

export class DonationDistributionService {
  static validateCreateDistribution(payload: unknown): CreateDistributionInput {
    return DonationDistributionSchema.validateCreateDistribution(payload);
  }

  static validateQuery(
    params: Record<string, unknown> | URLSearchParams,
  ): DistributionFilterQuery {
    return DonationDistributionSchema.validateQuery(params);
  }

  static async getSummary(): Promise<DonationDistributionSummary> {
    try {
      const [
        platformDonations,
        reportDonations,
        platformDistributions,
        reportDistributions,
      ] = await Promise.all([
        getPlatformDonationsSum(),
        getReportDonationsSum(),
        getPlatformDistributionsSum(),
        getReportDistributionsSum(),
      ]);

      const totalPlatformDonations = platformDonations.amount;
      const totalReportDonations = reportDonations.amount;
      const totalDonations = totalPlatformDonations + totalReportDonations;

      const totalDistributedPlatform = platformDistributions.amount;
      const totalDistributedReports = reportDistributions.amount;
      const totalDistributed =
        totalDistributedPlatform + totalDistributedReports;

      const remainingPlatformBalance = Math.max(
        0,
        totalPlatformDonations - totalDistributedPlatform,
      );
      const remainingReportBalance = Math.max(
        0,
        totalReportDonations - totalDistributedReports,
      );
      const totalRemainingBalance =
        remainingPlatformBalance + remainingReportBalance;

      const payoutPool = totalPlatformDonations * 0.9;
      const operationalPool = totalPlatformDonations * 0.1;

      return {
        totalPlatformDonations,
        totalReportDonations,
        totalDonations,
        totalDistributed,
        totalDistributedPlatform,
        totalDistributedReports,
        remainingPlatformBalance,
        remainingReportBalance,
        totalRemainingBalance,
        payoutPool,
        operationalPool,
      };
    } catch (error) {
      console.error('DONATION DISTRIBUTION GET SUMMARY ERROR:', error);
      if (error instanceof ApiError) throw error;
      throw Errors.internal(
        'Failed to calculate donation distribution summary',
      );
    }
  }

  static async getGroups(
    query: DistributionFilterQuery,
  ): Promise<DonationDistributionGroup[]> {
    try {
      const groups: DonationDistributionGroup[] = [];
      const targetType = query.targetType || 'ALL';

      // 1. Platform Group (if ALL or PLATFORM)
      if (targetType === 'ALL' || targetType === 'PLATFORM') {
        const [platformDonations, platformDistributions] = await Promise.all([
          getPlatformDonationsSum(),
          getPlatformDistributionsSum(),
        ]);

        const remainingBalance = Math.max(
          0,
          platformDonations.amount - platformDistributions.amount,
        );

        // Filter platform by search if provided
        const matchesSearch =
          !query.search ||
          'platform operasional & payout'.includes(query.search.toLowerCase());

        if (matchesSearch) {
          groups.push({
            id: 'platform',
            targetType: DonationType.PLATFORM,
            name: 'Platform Operasional & Payout',
            reportId: null,
            reportTitle: null,
            reportCategory: null,
            incidentDate: null,
            totalCollected: platformDonations.amount,
            totalDistributed: platformDistributions.amount,
            remainingBalance,
            distributionCount: platformDistributions.count,
            donationCount: platformDonations.count,
          });
        }
      }

      // 2. Report Groups (if ALL or REPORT)
      if (targetType === 'ALL' || targetType === 'REPORT') {
        const reportActivities = await getReportsWithActivity(query.search);

        for (const item of reportActivities) {
          groups.push({
            id: String(item.report.id),
            targetType: DonationType.REPORT,
            name: item.report.title,
            reportId: item.report.id,
            reportTitle: item.report.title,
            reportCategory: item.report.category,
            incidentDate: item.report.incidentDate
              ? item.report.incidentDate.toISOString()
              : null,
            totalCollected: item.totalCollected,
            totalDistributed: item.totalDistributed,
            remainingBalance: item.remainingBalance,
            distributionCount: item.distributionCount,
            donationCount: item.donationCount,
          });
        }
      }

      return groups;
    } catch (error) {
      console.error('DONATION DISTRIBUTION GET GROUPS ERROR:', error);
      if (error instanceof ApiError) throw error;
      throw Errors.internal('Failed to retrieve distribution groups');
    }
  }

  static async getGroupDetail(
    groupId: string,
  ): Promise<DonationDistributionGroupDetail> {
    try {
      if (groupId === 'platform') {
        const [
          platformDonations,
          platformDistributions,
          distributions,
          donations,
        ] = await Promise.all([
          getPlatformDonationsSum(),
          getPlatformDistributionsSum(),
          getTargetDistributions(DonationType.PLATFORM),
          getTargetDonations(DonationType.PLATFORM),
        ]);

        const remainingBalance = Math.max(
          0,
          platformDonations.amount - platformDistributions.amount,
        );

        const group: DonationDistributionGroup = {
          id: 'platform',
          targetType: DonationType.PLATFORM,
          name: 'Platform Operasional & Payout',
          reportId: null,
          reportTitle: null,
          reportCategory: null,
          incidentDate: null,
          totalCollected: platformDonations.amount,
          totalDistributed: platformDistributions.amount,
          remainingBalance,
          distributionCount: platformDistributions.count,
          donationCount: platformDonations.count,
        };

        const formattedDistributions: DonationDistributionRecord[] =
          distributions.map((d) => ({
            id: d.id,
            targetType: d.targetType,
            reportId: d.reportId,
            amount: Number(d.amount),
            recipient: d.recipient,
            notes: d.notes,
            distributedAt: d.distributedAt.toISOString(),
            createdById: d.createdById,
            createdAt: d.createdAt.toISOString(),
            report: d.report,
            createdBy: d.createdBy,
          }));

        const formattedDonations = donations.map((d) => ({
          id: d.id,
          amount: Number(d.amount),
          timestamp: d.timestamp.toISOString(),
          donorName: d.user?.name || 'Anonim',
          donorEmail: d.user?.email || null,
          paymentStatus: d.paymentStatus,
          paymentMethod: d.paymentMethod,
        }));

        return {
          group,
          distributions: formattedDistributions,
          donations: formattedDonations,
        };
      }

      const reportId = Number(groupId);
      if (isNaN(reportId) || reportId <= 0) {
        throw Errors.badRequest('Invalid group ID format');
      }

      const report = await findReportById(reportId);
      if (!report) {
        throw Errors.notFound('Report not found');
      }

      const [finances, distributions, donations] = await Promise.all([
        getReportFinances(reportId),
        getTargetDistributions(DonationType.REPORT, reportId),
        getTargetDonations(DonationType.REPORT, reportId),
      ]);

      const group: DonationDistributionGroup = {
        id: String(report.id),
        targetType: DonationType.REPORT,
        name: report.title,
        reportId: report.id,
        reportTitle: report.title,
        reportCategory: report.category,
        incidentDate: report.incidentDate
          ? report.incidentDate.toISOString()
          : null,
        totalCollected: finances.totalCollected,
        totalDistributed: finances.totalDistributed,
        remainingBalance: finances.remainingBalance,
        distributionCount: finances.distributionCount,
        donationCount: finances.donationCount,
      };

      const formattedDistributions: DonationDistributionRecord[] =
        distributions.map((d) => ({
          id: d.id,
          targetType: d.targetType,
          reportId: d.reportId,
          amount: Number(d.amount),
          recipient: d.recipient,
          notes: d.notes,
          distributedAt: d.distributedAt.toISOString(),
          createdById: d.createdById,
          createdAt: d.createdAt.toISOString(),
          report: d.report,
          createdBy: d.createdBy,
        }));

      const formattedDonations = donations.map((d) => ({
        id: d.id,
        amount: Number(d.amount),
        timestamp: d.timestamp.toISOString(),
        donorName: d.user?.name || 'Anonim',
        donorEmail: d.user?.email || null,
        paymentStatus: d.paymentStatus,
        paymentMethod: d.paymentMethod,
      }));

      return {
        group,
        distributions: formattedDistributions,
        donations: formattedDonations,
      };
    } catch (error) {
      console.error('DONATION DISTRIBUTION GET GROUP DETAIL ERROR:', error);
      if (error instanceof ApiError) throw error;
      throw Errors.internal('Failed to retrieve group detail');
    }
  }

  static async getHistory(query: DistributionFilterQuery) {
    try {
      const { records, totalCount, page, limit } =
        await findDistributions(query);

      const formattedRecords: DonationDistributionRecord[] = records.map(
        (d) => ({
          id: d.id,
          targetType: d.targetType,
          reportId: d.reportId,
          amount: Number(d.amount),
          recipient: d.recipient,
          notes: d.notes,
          distributedAt: d.distributedAt.toISOString(),
          createdById: d.createdById,
          createdAt: d.createdAt.toISOString(),
          report: d.report,
          createdBy: d.createdBy,
        }),
      );

      return {
        distributions: formattedRecords,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      console.error('DONATION DISTRIBUTION GET HISTORY ERROR:', error);
      if (error instanceof ApiError) throw error;
      throw Errors.internal('Failed to retrieve distribution history');
    }
  }

  static async getDistributionById(
    id: number,
  ): Promise<DonationDistributionRecord> {
    try {
      if (isNaN(id) || id <= 0) {
        throw Errors.badRequest('Invalid distribution ID');
      }

      const record = await findDistributionById(id);
      if (!record) {
        throw Errors.notFound('Distribution record not found');
      }

      return {
        id: record.id,
        targetType: record.targetType,
        reportId: record.reportId,
        amount: Number(record.amount),
        recipient: record.recipient,
        notes: record.notes,
        distributedAt: record.distributedAt.toISOString(),
        createdById: record.createdById,
        createdAt: record.createdAt.toISOString(),
        report: record.report,
        createdBy: record.createdBy,
      };
    } catch (error) {
      console.error('DONATION DISTRIBUTION GET BY ID ERROR:', error);
      if (error instanceof ApiError) throw error;
      throw Errors.internal('Failed to retrieve distribution record');
    }
  }

  static async createDistribution(
    adminId: string,
    input: CreateDistributionInput,
  ): Promise<DonationDistributionRecord> {
    try {
      // 1. Balance validation
      if (input.targetType === DonationType.REPORT) {
        if (!input.reportId) {
          throw Errors.badRequest('reportId is required for REPORT target');
        }

        const report = await findReportById(input.reportId);
        if (!report) {
          throw Errors.notFound('Report not found');
        }

        const finances = await getReportFinances(input.reportId);

        if (finances.remainingBalance === 0) {
          throw Errors.unprocessable(
            'Belum ada dana donasi yang tersedia untuk laporan ini (saldo Rp 0).',
            { remainingBalance: 0, requestedAmount: input.amount },
          );
        }

        if (input.amount > finances.remainingBalance) {
          throw Errors.unprocessable(
            `Dana donasi tidak mencukupi untuk disalurkan. Sisa dana tersedia: Rp ${finances.remainingBalance.toLocaleString('id-ID')}`,
            {
              remainingBalance: finances.remainingBalance,
              requestedAmount: input.amount,
            },
          );
        }
      } else {
        // Target is PLATFORM
        const [platformDonations, platformDistributions] = await Promise.all([
          getPlatformDonationsSum(),
          getPlatformDistributionsSum(),
        ]);

        const remainingBalance = Math.max(
          0,
          platformDonations.amount - platformDistributions.amount,
        );

        if (remainingBalance === 0) {
          throw Errors.unprocessable(
            'Belum ada dana operasional & payout platform yang tersedia (saldo Rp 0).',
            { remainingBalance: 0, requestedAmount: input.amount },
          );
        }

        if (input.amount > remainingBalance) {
          throw Errors.unprocessable(
            `Dana platform tidak mencukupi untuk disalurkan. Sisa dana tersedia: Rp ${remainingBalance.toLocaleString('id-ID')}`,
            { remainingBalance, requestedAmount: input.amount },
          );
        }
      }

      // 2. Persist record
      const created = await createDistributionRecord({
        ...input,
        createdById: adminId,
      });

      return {
        id: created.id,
        targetType: created.targetType,
        reportId: created.reportId,
        amount: Number(created.amount),
        recipient: created.recipient,
        notes: created.notes,
        distributedAt: created.distributedAt.toISOString(),
        createdById: created.createdById,
        createdAt: created.createdAt.toISOString(),
        report: created.report,
        createdBy: created.createdBy,
      };
    } catch (error) {
      console.error('DONATION DISTRIBUTION CREATE SERVICE ERROR:', error);
      if (error instanceof ApiError) throw error;
      throw Errors.internal('Failed to create donation distribution record');
    }
  }

  static async getPsychologistPayoutSummary(
    monthsCount = 6,
  ): Promise<PsychologistPayoutSummary> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Current Month calculations
      const [
        currentMonthPool,
        completedSessionsGrouped,
        totalCompletedSessions,
        psychologists,
      ] = await Promise.all([
        getPlatformDonationsInPeriod(startOfMonth),
        getCompletedConsultationsInPeriod(startOfMonth),
        getCompletedConsultationsTotalInPeriod(startOfMonth),
        getPsychologistsList(),
      ]);

      const payoutPool = currentMonthPool * 0.9;
      const operationalPool = currentMonthPool * 0.1;

      const sessionsMap = new Map<string, number>();
      for (const item of completedSessionsGrouped) {
        if (item.psychologistId) {
          sessionsMap.set(item.psychologistId, item._count.id);
        }
      }

      const psychologistItems = psychologists.map((psych) => {
        const sessions = sessionsMap.get(psych.id) || 0;
        const sessionRatio =
          totalCompletedSessions > 0 ? sessions / totalCompletedSessions : 0;
        const payoutAmount = sessionRatio * payoutPool;

        return {
          id: psych.id,
          name: psych.name,
          email: psych.email,
          completedSessions: sessions,
          sessionRatio,
          payoutAmount,
        };
      });

      // History for previous months (defaults to 6 months to reach May and earlier)
      const offsets = Array.from(
        { length: Math.max(1, monthsCount) },
        (_, i) => i + 1,
      );
      const history = await Promise.all(
        offsets.map(async (offset) => {
          const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
          const start = new Date(d.getFullYear(), d.getMonth(), 1);
          const end = new Date(
            d.getFullYear(),
            d.getMonth() + 1,
            0,
            23,
            59,
            59,
          );

          const [pool, sessions] = await Promise.all([
            getPlatformDonationsInPeriod(start, end),
            getCompletedConsultationsTotalInPeriod(start, end),
          ]);

          return {
            id: offset,
            period: d.toLocaleString('id-ID', {
              month: 'long',
              year: 'numeric',
            }),
            platformPool: pool,
            payoutPool: pool * 0.9,
            totalCompletedSessions: sessions,
          };
        }),
      );

      return {
        currentMonth: {
          period: now.toLocaleString('id-ID', {
            month: 'long',
            year: 'numeric',
          }),
          totalPlatformPool: currentMonthPool,
          payoutPool,
          operationalPool,
          totalCompletedSessions,
          psychologistCount: psychologists.length,
          psychologists: psychologistItems,
        },
        history,
      };
    } catch (error) {
      console.error(
        'DONATION DISTRIBUTION GET PSYCHOLOGIST PAYOUT ERROR:',
        error,
      );
      if (error instanceof ApiError) throw error;
      throw Errors.internal('Failed to retrieve psychologist payout summary');
    }
  }
}
