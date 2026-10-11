import { DonationDistributionService } from '@/modules/donation-distribution/donation-distribution.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: mocks.headers,
}));

vi.mock('@/lib/auth/auth', () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock(
  '@/modules/donation-distribution/donation-distribution.service',
  () => ({
    DonationDistributionService: {
      validateCreateDistribution: vi.fn(),
      validateQuery: vi.fn(),
      getSummary: vi.fn(),
      getGroups: vi.fn(),
      getGroupDetail: vi.fn(),
      getHistory: vi.fn(),
      createDistribution: vi.fn(),
      getDistributionById: vi.fn(),
      getPsychologistPayoutSummary: vi.fn(),
    },
  }),
);

const mockService = vi.mocked(DonationDistributionService);

describe('Admin Donation Distribution Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  describe('GET /api/dashboard/admin/donations/distributions/summary', () => {
    it('returns 401 when not logged in', async () => {
      const { GET } =
        await import('@/app/api/dashboard/admin/donations/distributions/summary/route');
      mocks.getSession.mockResolvedValue(null);

      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('returns 403 when user is not admin', async () => {
      const { GET } =
        await import('@/app/api/dashboard/admin/donations/distributions/summary/route');
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', role: 'USER' },
      });

      const res = await GET();
      expect(res.status).toBe(403);
    });

    it('returns summary data when user is admin', async () => {
      const { GET } =
        await import('@/app/api/dashboard/admin/donations/distributions/summary/route');
      mocks.getSession.mockResolvedValue({
        user: { id: 'a1', role: 'ADMIN' },
      });

      const mockSummary = {
        totalPlatformDonations: 10000000,
        totalReportDonations: 5000000,
        totalDonations: 15000000,
        totalDistributed: 3000000,
        totalDistributedPlatform: 1000000,
        totalDistributedReports: 2000000,
        remainingPlatformBalance: 9000000,
        remainingReportBalance: 3000000,
        totalRemainingBalance: 12000000,
        payoutPool: 9000000,
        operationalPool: 1000000,
      };
      mockService.getSummary.mockResolvedValue(mockSummary);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data).toEqual(mockSummary);
    });
  });

  describe('GET /api/dashboard/admin/donations/distributions/groups', () => {
    it('returns groups when user is admin', async () => {
      const { GET } =
        await import('@/app/api/dashboard/admin/donations/distributions/groups/route');
      mocks.getSession.mockResolvedValue({
        user: { id: 'a1', role: 'ADMIN' },
      });

      mockService.validateQuery.mockReturnValue({
        targetType: 'ALL',
        page: 1,
        limit: 10,
      });

      const mockGroups = [
        {
          id: 'platform',
          targetType: 'PLATFORM' as const,
          name: 'Platform Operasional & Payout',
          totalCollected: 10000000,
          totalDistributed: 1000000,
          remainingBalance: 9000000,
          distributionCount: 1,
          donationCount: 10,
        },
      ];
      mockService.getGroups.mockResolvedValue(mockGroups);

      const req = new Request(
        'http://localhost:3000/api/dashboard/admin/donations/distributions/groups',
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.groups).toEqual(mockGroups);
    });
  });

  describe('GET /api/dashboard/admin/donations/distributions/groups/[groupId]', () => {
    it('returns group detail for groupId', async () => {
      const { GET } =
        await import('@/app/api/dashboard/admin/donations/distributions/groups/[groupId]/route');
      mocks.getSession.mockResolvedValue({
        user: { id: 'a1', role: 'ADMIN' },
      });

      const mockDetail = {
        group: {
          id: 'platform',
          targetType: 'PLATFORM' as const,
          name: 'Platform Operasional & Payout',
          totalCollected: 10000000,
          totalDistributed: 1000000,
          remainingBalance: 9000000,
          distributionCount: 1,
          donationCount: 10,
        },
        distributions: [],
        donations: [],
      };
      mockService.getGroupDetail.mockResolvedValue(mockDetail);

      const req = new Request(
        'http://localhost:3000/api/dashboard/admin/donations/distributions/groups/platform',
      );
      const res = await GET(req, {
        params: Promise.resolve({ groupId: 'platform' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data).toEqual(mockDetail);
    });
  });

  describe('GET /api/dashboard/admin/donations/distributions/history', () => {
    it('returns history when user is admin', async () => {
      const { GET } =
        await import('@/app/api/dashboard/admin/donations/distributions/history/route');
      mocks.getSession.mockResolvedValue({
        user: { id: 'a1', role: 'ADMIN' },
      });

      mockService.validateQuery.mockReturnValue({
        targetType: 'ALL',
        page: 1,
        limit: 10,
      });

      const mockHistory = {
        distributions: [],
        totalCount: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
      mockService.getHistory.mockResolvedValue(mockHistory);

      const req = new Request(
        'http://localhost:3000/api/dashboard/admin/donations/distributions/history',
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data).toEqual(mockHistory);
    });
  });

  describe('POST /api/dashboard/admin/donations/distributions', () => {
    it('creates distribution when user is admin', async () => {
      const { POST } =
        await import('@/app/api/dashboard/admin/donations/distributions/route');
      mocks.getSession.mockResolvedValue({
        user: { id: 'a1', role: 'ADMIN' },
      });

      const input = {
        targetType: 'REPORT' as const,
        reportId: 5,
        amount: 500000,
        recipient: 'Korban X',
      };
      mockService.validateCreateDistribution.mockReturnValue(input);

      const mockCreated = {
        id: 1,
        ...input,
        notes: null,
        distributedAt: new Date().toISOString(),
        createdById: 'a1',
        createdAt: new Date().toISOString(),
      };
      mockService.createDistribution.mockResolvedValue(mockCreated);

      const req = new Request(
        'http://localhost:3000/api/dashboard/admin/donations/distributions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      );

      const res = await POST(req);
      expect(res).not.toBeNull();
      const body = await res!.json();

      expect(res!.status).toBe(200);
      expect(body.data).toEqual(mockCreated);
      expect(mockService.createDistribution).toHaveBeenCalledWith('a1', input);
    });
  });

  describe('GET /api/dashboard/admin/donations/distributions/[id]', () => {
    it('returns single distribution detail by id', async () => {
      const { GET } =
        await import('@/app/api/dashboard/admin/donations/distributions/[id]/route');
      mocks.getSession.mockResolvedValue({
        user: { id: 'a1', role: 'ADMIN' },
      });

      const mockRecord = {
        id: 1,
        targetType: 'PLATFORM' as const,
        reportId: null,
        amount: 250000,
        recipient: 'Server Provider',
        notes: null,
        distributedAt: new Date().toISOString(),
        createdById: 'a1',
        createdAt: new Date().toISOString(),
      };
      mockService.getDistributionById.mockResolvedValue(mockRecord);

      const req = new Request(
        'http://localhost:3000/api/dashboard/admin/donations/distributions/1',
      );
      const res = await GET(req, {
        params: Promise.resolve({ id: '1' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data).toEqual(mockRecord);
      expect(mockService.getDistributionById).toHaveBeenCalledWith(1);
    });
  });

  describe('GET /api/dashboard/admin/donations/payout-summary', () => {
    it('returns psychologist payout summary for admin', async () => {
      const { GET } =
        await import('@/app/api/dashboard/admin/donations/payout-summary/route');
      mocks.getSession.mockResolvedValue({
        user: { id: 'a1', role: 'ADMIN' },
      });

      const mockPayout = {
        currentMonth: {
          period: 'Oktober 2026',
          totalPlatformPool: 10000000,
          payoutPool: 9000000,
          operationalPool: 1000000,
          totalCompletedSessions: 5,
          psychologistCount: 2,
          psychologists: [],
        },
        history: [],
      };
      mockService.getPsychologistPayoutSummary.mockResolvedValue(mockPayout);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data).toEqual(mockPayout);
    });
  });
});
