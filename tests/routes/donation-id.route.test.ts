import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
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
    donation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockDonationFindUnique = vi.mocked(prisma.donation.findUnique);
const mockDonationUpdate = vi.mocked(prisma.donation.update);

describe('API Route /api/donation/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  describe('GET handler', () => {
    it('returns 401 when unauthenticated', async () => {
      const { GET } = await import('@/app/api/donation/[id]/route');
      mocks.getSession.mockResolvedValue(null);

      const res = await GET(
        new Request('http://localhost:3000/api/donation/1'),
        {
          params: Promise.resolve({ id: '1' }),
        },
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 400 when donation ID is invalid', async () => {
      const { GET } = await import('@/app/api/donation/[id]/route');
      mocks.getSession.mockResolvedValue({
        user: { id: 'user-1', role: 'USER' },
      });

      const res = await GET(
        new Request('http://localhost:3000/api/donation/abc'),
        {
          params: Promise.resolve({ id: 'abc' }),
        },
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 404 when donation is not found', async () => {
      const { GET } = await import('@/app/api/donation/[id]/route');
      mocks.getSession.mockResolvedValue({
        user: { id: 'user-1', role: 'USER' },
      });
      mockDonationFindUnique.mockResolvedValue(null);

      const res = await GET(
        new Request('http://localhost:3000/api/donation/999'),
        {
          params: Promise.resolve({ id: '999' }),
        },
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 403 when user is not owner and not admin', async () => {
      const { GET } = await import('@/app/api/donation/[id]/route');
      mocks.getSession.mockResolvedValue({
        user: { id: 'user-1', role: 'USER' },
      });
      mockDonationFindUnique.mockResolvedValue({
        id: 1,
        userId: 'other-user',
        amount: new Prisma.Decimal(50000),
        paymentMethod: 'QRIS',
        paymentStatus: 'PAID',
        donationType: 'REPORT',
        timestamp: new Date(),
        midtransOrderId: 'MID-1',
        snapToken: 'token-1',
        user: { id: 'other-user', name: 'Other', email: 'o@mail.com' },
        report: null,
      } as unknown as Awaited<ReturnType<typeof prisma.donation.findUnique>>);

      const res = await GET(
        new Request('http://localhost:3000/api/donation/1'),
        {
          params: Promise.resolve({ id: '1' }),
        },
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('returns donation detail successfully when user is owner', async () => {
      const { GET } = await import('@/app/api/donation/[id]/route');
      mocks.getSession.mockResolvedValue({
        user: { id: 'user-1', role: 'USER' },
      });
      mockDonationFindUnique.mockResolvedValue({
        id: 1,
        userId: 'user-1',
        amount: new Prisma.Decimal(50000),
        paymentMethod: 'QRIS',
        paymentStatus: 'PAID',
        donationType: 'REPORT',
        timestamp: new Date('2026-05-01'),
        midtransOrderId: 'MID-1',
        snapToken: 'token-1',
        user: { id: 'user-1', name: 'User 1', email: 'u@mail.com' },
        report: { id: 10, title: 'Report Title', category: 'PHYSICAL' },
      } as unknown as Awaited<ReturnType<typeof prisma.donation.findUnique>>);

      const res = await GET(
        new Request('http://localhost:3000/api/donation/1'),
        {
          params: Promise.resolve({ id: '1' }),
        },
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.id).toBe(1);
      expect(body.data.amount).toBe(50000);
      expect(body.data.report.title).toBe('Report Title');
    });

    it('returns donation detail successfully when user is ADMIN even if not owner', async () => {
      const { GET } = await import('@/app/api/donation/[id]/route');
      mocks.getSession.mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
      });
      mockDonationFindUnique.mockResolvedValue({
        id: 1,
        userId: 'someone-else',
        amount: new Prisma.Decimal(75000),
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'PAID',
        donationType: 'PLATFORM',
        timestamp: new Date('2026-05-01'),
        midtransOrderId: null,
        snapToken: null,
        user: { id: 'someone-else', name: 'Donor', email: 'd@mail.com' },
        report: null,
      } as unknown as Awaited<ReturnType<typeof prisma.donation.findUnique>>);

      const res = await GET(
        new Request('http://localhost:3000/api/donation/1'),
        {
          params: Promise.resolve({ id: '1' }),
        },
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.id).toBe(1);
      expect(body.data.amount).toBe(75000);
    });
  });

  describe('PATCH handler', () => {
    it('cancels pending donation successfully for owner', async () => {
      const { PATCH } = await import('@/app/api/donation/[id]/route');
      mocks.getSession.mockResolvedValue({
        user: { id: 'user-1', role: 'USER' },
      });
      mockDonationFindUnique.mockResolvedValue({
        id: 1,
        userId: 'user-1',
        paymentStatus: 'PENDING',
      } as unknown as Awaited<ReturnType<typeof prisma.donation.findUnique>>);
      mockDonationUpdate.mockResolvedValue({
        id: 1,
        paymentStatus: 'CANCELLED',
      } as unknown as Awaited<ReturnType<typeof prisma.donation.update>>);

      const res = await PATCH(
        new Request('http://localhost:3000/api/donation/1'),
        {
          params: Promise.resolve({ id: '1' }),
        },
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.paymentStatus).toBe('CANCELLED');
    });
  });
});
