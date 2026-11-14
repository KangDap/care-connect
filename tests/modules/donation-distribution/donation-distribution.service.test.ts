import { Prisma } from '@/generated/prisma/client';
import { DonationType, ReportCategory } from '@/generated/prisma/enums';
import { ApiError } from '@/lib/error';
import * as repos from '@/modules/donation-distribution/donation-distribution.repositories';
import { DonationDistributionService } from '@/modules/donation-distribution/donation-distribution.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/modules/donation-distribution/donation-distribution.repositories',
  () => ({
    getPlatformDonationsSum: vi.fn(),
    getReportDonationsSum: vi.fn(),
    getPlatformDistributionsSum: vi.fn(),
    getReportDistributionsSum: vi.fn(),
    getReportFinances: vi.fn(),
    findReportById: vi.fn(),
    getReportsWithActivity: vi.fn(),
    createDistributionRecord: vi.fn(),
    findDistributions: vi.fn(),
    findDistributionById: vi.fn(),
    getTargetDistributions: vi.fn(),
    getTargetDonations: vi.fn(),
    getPsychologistsList: vi.fn(),
    getCompletedConsultationsInPeriod: vi.fn(),
    getPlatformDonationsInPeriod: vi.fn(),
    getCompletedConsultationsTotalInPeriod: vi.fn(),
  }),
);

const mockGetPlatformDonationsSum = vi.mocked(repos.getPlatformDonationsSum);
const mockGetReportDonationsSum = vi.mocked(repos.getReportDonationsSum);
const mockGetPlatformDistributionsSum = vi.mocked(
  repos.getPlatformDistributionsSum,
);
const mockGetReportDistributionsSum = vi.mocked(
  repos.getReportDistributionsSum,
);
const mockGetReportFinances = vi.mocked(repos.getReportFinances);
const mockFindReportById = vi.mocked(repos.findReportById);
const mockGetReportsWithActivity = vi.mocked(repos.getReportsWithActivity);
const mockCreateDistributionRecord = vi.mocked(repos.createDistributionRecord);
const mockFindDistributions = vi.mocked(repos.findDistributions);
const mockFindDistributionById = vi.mocked(repos.findDistributionById);
const mockGetTargetDistributions = vi.mocked(repos.getTargetDistributions);
const mockGetTargetDonations = vi.mocked(repos.getTargetDonations);
const mockGetPsychologistsList = vi.mocked(repos.getPsychologistsList);
const mockGetCompletedConsultationsInPeriod = vi.mocked(
  repos.getCompletedConsultationsInPeriod,
);
const mockGetPlatformDonationsInPeriod = vi.mocked(
  repos.getPlatformDonationsInPeriod,
);
const mockGetCompletedConsultationsTotalInPeriod = vi.mocked(
  repos.getCompletedConsultationsTotalInPeriod,
);

describe('DonationDistributionService.getSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates platform and report balances accurately with pools', async () => {
    mockGetPlatformDonationsSum.mockResolvedValue({
      amount: 10000000,
      count: 10,
    });
    mockGetReportDonationsSum.mockResolvedValue({ amount: 5000000, count: 5 });
    mockGetPlatformDistributionsSum.mockResolvedValue({
      amount: 2000000,
      count: 2,
    });
    mockGetReportDistributionsSum.mockResolvedValue({
      amount: 3000000,
      count: 3,
    });

    const summary = await DonationDistributionService.getSummary();

    expect(summary).toEqual({
      totalPlatformDonations: 10000000,
      totalReportDonations: 5000000,
      totalDonations: 15000000,
      totalDistributed: 5000000,
      totalDistributedPlatform: 2000000,
      totalDistributedReports: 3000000,
      remainingPlatformBalance: 8000000,
      remainingReportBalance: 2000000,
      totalRemainingBalance: 10000000,
      payoutPool: 9000000, // 90% of 10M
      operationalPool: 1000000, // 10% of 10M
    });
  });

  it('throws internal error when repository query fails', async () => {
    mockGetPlatformDonationsSum.mockRejectedValue(new Error('db down'));

    await expect(
      DonationDistributionService.getSummary(),
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      status: 500,
    });
  });
});

describe('DonationDistributionService.getGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns both platform and report groups when targetType is ALL', async () => {
    mockGetPlatformDonationsSum.mockResolvedValue({
      amount: 5000000,
      count: 4,
    });
    mockGetPlatformDistributionsSum.mockResolvedValue({
      amount: 1000000,
      count: 1,
    });
    mockGetReportsWithActivity.mockResolvedValue([
      {
        report: {
          id: 1,
          title: 'Kasus Bullying Sekolah',
          category: 'PSYCHOLOGICAL',
          incidentDate: new Date('2026-05-01'),
          _count: { donations: 2, distributions: 1 },
        },
        totalCollected: 2000000,
        totalDistributed: 500000,
        remainingBalance: 1500000,
        donationCount: 2,
        distributionCount: 1,
      },
    ]);

    const groups = await DonationDistributionService.getGroups({
      targetType: 'ALL',
    });

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      id: 'platform',
      targetType: 'PLATFORM',
      totalCollected: 5000000,
      totalDistributed: 1000000,
      remainingBalance: 4000000,
    });
    expect(groups[1]).toMatchObject({
      id: '1',
      targetType: 'REPORT',
      name: 'Kasus Bullying Sekolah',
      remainingBalance: 1500000,
    });
  });

  it('returns only platform group when targetType is PLATFORM', async () => {
    mockGetPlatformDonationsSum.mockResolvedValue({
      amount: 3000000,
      count: 2,
    });
    mockGetPlatformDistributionsSum.mockResolvedValue({
      amount: 500000,
      count: 1,
    });

    const groups = await DonationDistributionService.getGroups({
      targetType: 'PLATFORM',
    });

    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe('platform');
    expect(mockGetReportsWithActivity).not.toHaveBeenCalled();
  });
});

describe('DonationDistributionService.getGroupDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns platform group detail with distributions and donations', async () => {
    mockGetPlatformDonationsSum.mockResolvedValue({
      amount: 1000000,
      count: 1,
    });
    mockGetPlatformDistributionsSum.mockResolvedValue({
      amount: 200000,
      count: 1,
    });
    mockGetTargetDistributions.mockResolvedValue([
      {
        id: 1,
        targetType: DonationType.PLATFORM,
        reportId: null,
        amount: new Prisma.Decimal(200000),
        recipient: 'Server Host',
        notes: null,
        distributedAt: new Date('2026-10-01'),
        createdById: 'admin-1',
        createdAt: new Date('2026-10-01'),
        report: null,
        createdBy: { id: 'admin-1', name: 'Admin', email: 'admin@care.id' },
      },
    ]);
    mockGetTargetDonations.mockResolvedValue([
      {
        id: 1,
        amount: new Prisma.Decimal(1000000),
        timestamp: new Date('2026-09-01'),
        paymentStatus: 'PAID',
        paymentMethod: 'QRIS',
        user: { name: 'Donatur A', email: 'd@mail.com' },
      },
    ]);

    const result = await DonationDistributionService.getGroupDetail('platform');

    expect(result.group.id).toBe('platform');
    expect(result.group.remainingBalance).toBe(800000);
    expect(result.distributions).toHaveLength(1);
    expect(result.donations).toHaveLength(1);
  });

  it('returns report group detail when valid reportId is given', async () => {
    mockFindReportById.mockResolvedValue({
      id: 7,
      title: 'Kasus Medis Darurat',
      category: 'PHYSICAL',
      incidentDate: new Date('2026-04-10'),
    });
    mockGetReportFinances.mockResolvedValue({
      totalCollected: 5000000,
      totalDistributed: 2000000,
      remainingBalance: 3000000,
      donationCount: 5,
      distributionCount: 2,
    });
    mockGetTargetDistributions.mockResolvedValue([]);
    mockGetTargetDonations.mockResolvedValue([]);

    const result = await DonationDistributionService.getGroupDetail('7');

    expect(result.group.id).toBe('7');
    expect(result.group.remainingBalance).toBe(3000000);
    expect(result.group.reportTitle).toBe('Kasus Medis Darurat');
  });

  it('throws 404 when report is not found', async () => {
    mockFindReportById.mockResolvedValue(null);

    await expect(
      DonationDistributionService.getGroupDetail('999'),
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('throws 400 when group ID is invalid', async () => {
    await expect(
      DonationDistributionService.getGroupDetail('invalid-id'),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
    });
  });
});

describe('DonationDistributionService.createDistribution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates report distribution when balance is sufficient', async () => {
    mockFindReportById.mockResolvedValue({
      id: 3,
      title: 'Laporan Bantuan Sosial',
      category: 'OTHER',
      incidentDate: new Date('2026-03-01'),
    });
    mockGetReportFinances.mockResolvedValue({
      totalCollected: 2000000,
      totalDistributed: 500000,
      remainingBalance: 1500000, // Sufficient for 1M
      donationCount: 2,
      distributionCount: 1,
    });

    const mockCreated = {
      id: 10,
      targetType: DonationType.REPORT,
      reportId: 3,
      amount: new Prisma.Decimal(1000000),
      recipient: 'Ibu Ani',
      notes: 'Bantuan sembako',
      distributedAt: new Date('2026-10-10'),
      createdById: 'admin-1',
      createdAt: new Date('2026-10-10'),
      report: {
        id: 3,
        title: 'Laporan Bantuan Sosial',
        category: ReportCategory.OTHER,
      },
      createdBy: { id: 'admin-1', name: 'Admin', email: 'admin@mail.com' },
    };
    mockCreateDistributionRecord.mockResolvedValue(mockCreated);

    const result = await DonationDistributionService.createDistribution(
      'admin-1',
      {
        targetType: 'REPORT',
        reportId: 3,
        amount: 1000000,
        recipient: 'Ibu Ani',
        notes: 'Bantuan sembako',
      },
    );

    expect(result.id).toBe(10);
    expect(result.amount).toBe(1000000);
    expect(mockCreateDistributionRecord).toHaveBeenCalledWith({
      targetType: 'REPORT',
      reportId: 3,
      amount: 1000000,
      recipient: 'Ibu Ani',
      notes: 'Bantuan sembako',
      createdById: 'admin-1',
    });
  });

  it('rejects report distribution with 400 when amount exceeds remaining balance', async () => {
    mockFindReportById.mockResolvedValue({
      id: 3,
      title: 'Laporan Bantuan Sosial',
      category: 'OTHER',
      incidentDate: new Date('2026-03-01'),
    });
    mockGetReportFinances.mockResolvedValue({
      totalCollected: 1000000,
      totalDistributed: 800000,
      remainingBalance: 200000, // Only 200k left!
      donationCount: 1,
      distributionCount: 1,
    });

    await expect(
      DonationDistributionService.createDistribution('admin-1', {
        targetType: 'REPORT',
        reportId: 3,
        amount: 500000, // Requests 500k > 200k
        recipient: 'Ibu Ani',
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });

    expect(mockCreateDistributionRecord).not.toHaveBeenCalled();
  });

  it('rejects report distribution with 422 when report balance is 0', async () => {
    mockFindReportById.mockResolvedValue({
      id: 3,
      title: 'Laporan Bantuan Sosial',
      category: ReportCategory.OTHER,
      incidentDate: new Date('2026-03-01'),
    });
    mockGetReportFinances.mockResolvedValue({
      totalCollected: 0,
      totalDistributed: 0,
      remainingBalance: 0,
      donationCount: 0,
      distributionCount: 0,
    });

    await expect(
      DonationDistributionService.createDistribution('admin-1', {
        targetType: 'REPORT',
        reportId: 3,
        amount: 100000,
        recipient: 'Ibu Ani',
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });

    expect(mockCreateDistributionRecord).not.toHaveBeenCalled();
  });

  it('rejects platform distribution with 422 when amount exceeds platform balance', async () => {
    mockGetPlatformDonationsSum.mockResolvedValue({
      amount: 1000000,
      count: 1,
    });
    mockGetPlatformDistributionsSum.mockResolvedValue({
      amount: 900000,
      count: 2,
    });
    // remaining is 100,000

    await expect(
      DonationDistributionService.createDistribution('admin-1', {
        targetType: 'PLATFORM',
        amount: 300000, // 300k > 100k
        recipient: 'Server Dev',
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });

    expect(mockCreateDistributionRecord).not.toHaveBeenCalled();
  });

  it('creates platform distribution successfully when balance is sufficient', async () => {
    mockGetPlatformDonationsSum.mockResolvedValue({
      amount: 5000000,
      count: 3,
    });
    mockGetPlatformDistributionsSum.mockResolvedValue({
      amount: 1000000,
      count: 1,
    });
    // remaining is 4,000,000

    const mockCreated = {
      id: 20,
      targetType: DonationType.PLATFORM,
      reportId: null,
      amount: new Prisma.Decimal(1500000),
      recipient: 'Penyedia Hosting',
      notes: null,
      distributedAt: new Date('2026-10-10'),
      createdById: 'admin-1',
      createdAt: new Date('2026-10-10'),
      report: null,
      createdBy: { id: 'admin-1', name: 'Admin', email: 'admin@mail.com' },
    };
    mockCreateDistributionRecord.mockResolvedValue(mockCreated);

    const result = await DonationDistributionService.createDistribution(
      'admin-1',
      {
        targetType: 'PLATFORM',
        amount: 1500000,
        recipient: 'Penyedia Hosting',
      },
    );

    expect(result.id).toBe(20);
    expect(result.amount).toBe(1500000);
    expect(mockCreateDistributionRecord).toHaveBeenCalled();
  });
});

describe('DonationDistributionService.getPsychologistPayoutSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates monthly psychologist payout proportions properly', async () => {
    mockGetPlatformDonationsInPeriod.mockResolvedValue(10000000); // 10M pool -> 9M payout pool
    mockGetCompletedConsultationsInPeriod.mockResolvedValue([
      { psychologistId: 'psych-1', _count: { id: 3 } },
      { psychologistId: 'psych-2', _count: { id: 1 } },
    ] as unknown as Awaited<
      ReturnType<typeof repos.getCompletedConsultationsInPeriod>
    >);
    mockGetCompletedConsultationsTotalInPeriod.mockResolvedValue(4);
    mockGetPsychologistsList.mockResolvedValue([
      { id: 'psych-1', name: 'Dr. Jane', email: 'jane@care.id' },
      { id: 'psych-2', name: 'Dr. John', email: 'john@care.id' },
    ]);

    const result =
      await DonationDistributionService.getPsychologistPayoutSummary();

    expect(result.currentMonth.totalPlatformPool).toBe(10000000);
    expect(result.currentMonth.payoutPool).toBe(9000000);
    expect(result.currentMonth.operationalPool).toBe(1000000);
    expect(result.currentMonth.totalCompletedSessions).toBe(4);

    const psych1 = result.currentMonth.psychologists.find(
      (p) => p.id === 'psych-1',
    );
    const psych2 = result.currentMonth.psychologists.find(
      (p) => p.id === 'psych-2',
    );

    expect(psych1?.completedSessions).toBe(3);
    expect(psych1?.sessionRatio).toBe(0.75);
    expect(psych1?.payoutAmount).toBe(6750000); // 75% of 9M

    expect(psych2?.completedSessions).toBe(1);
    expect(psych2?.sessionRatio).toBe(0.25);
    expect(psych2?.payoutAmount).toBe(2250000); // 25% of 9M
  });
});
