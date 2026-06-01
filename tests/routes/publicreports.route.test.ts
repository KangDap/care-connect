import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  reportFindMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    report: {
      findMany: mocks.reportFindMany,
    },
  },
}));

describe('API Route /api/publicreports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns public resolved reports with cover image', async () => {
    const { GET } = await import('@/app/api/publicreports/route');

    const reports = [
      {
        id: 1,
        title: 'Laporan Publik A',
        category: 'PSYCHOLOGICAL',
        province: 'Jawa Barat',
        city: 'Bandung',
        status: 'RESOLVED',
        incidentDate: new Date('2026-01-10T00:00:00.000Z'),
        description: 'Deskripsi laporan publik A',
        createdAt: new Date('2026-01-11T00:00:00.000Z'),
        evidences: [
          {
            fileUrl: 'https://example.com/document.pdf',
            mimeType: 'application/pdf',
            uploadedAt: new Date('2026-01-12T00:00:00.000Z'),
          },
          {
            fileUrl: 'https://example.com/cover.png',
            mimeType: 'image/png',
            uploadedAt: new Date('2026-01-13T00:00:00.000Z'),
          },
        ],
      },
    ];

    mocks.reportFindMany.mockResolvedValue(reports);

    const req = new Request('http://localhost:3000/api/publicreports');

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: [
        {
          id: 1,
          title: 'Laporan Publik A',
          category: 'PSYCHOLOGICAL',
          province: 'Jawa Barat',
          city: 'Bandung',
          status: 'RESOLVED',
          incidentDate: '2026-01-10T00:00:00.000Z',
          description: 'Deskripsi laporan publik A',
          createdAt: '2026-01-11T00:00:00.000Z',
          coverImageUrl: 'https://example.com/cover.png',
        },
      ],
    });

    expect(mocks.reportFindMany).toHaveBeenCalledWith({
      where: {
        isPublic: true,
        status: 'RESOLVED',
      },
      select: {
        id: true,
        title: true,
        category: true,
        province: true,
        city: true,
        status: true,
        incidentDate: true,
        description: true,
        createdAt: true,
        evidences: {
          select: {
            fileUrl: true,
            mimeType: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('GET returns coverImageUrl null when no image evidence exists', async () => {
    const { GET } = await import('@/app/api/publicreports/route');

    mocks.reportFindMany.mockResolvedValue([
      {
        id: 2,
        title: 'Laporan Tanpa Gambar',
        category: 'OTHER',
        province: 'DKI Jakarta',
        city: 'Jakarta',
        status: 'RESOLVED',
        incidentDate: new Date('2026-02-10T00:00:00.000Z'),
        description: 'Deskripsi laporan tanpa gambar.',
        createdAt: new Date('2026-02-11T00:00:00.000Z'),
        evidences: [
          {
            fileUrl: 'https://example.com/evidence.pdf',
            mimeType: 'application/pdf',
            uploadedAt: new Date('2026-02-12T00:00:00.000Z'),
          },
        ],
      },
    ]);

    const req = new Request('http://localhost:3000/api/publicreports');

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0]).toMatchObject({
      id: 2,
      title: 'Laporan Tanpa Gambar',
      coverImageUrl: null,
    });
  });

  it('GET supports category filter query parameter', async () => {
    const { GET } = await import('@/app/api/publicreports/route');

    mocks.reportFindMany.mockResolvedValue([]);

    const req = new Request(
      'http://localhost:3000/api/publicreports?category=PHYSICAL',
    );

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: [],
    });

    expect(mocks.reportFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isPublic: true,
          status: 'RESOLVED',
          category: 'PHYSICAL',
        },
      }),
    );
  });

  it('GET supports search query parameter', async () => {
    const { GET } = await import('@/app/api/publicreports/route');

    mocks.reportFindMany.mockResolvedValue([]);

    const req = new Request(
      'http://localhost:3000/api/publicreports?search=verbal',
    );

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: [],
    });

    expect(mocks.reportFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isPublic: true,
          status: 'RESOLVED',
          OR: [
            { title: { contains: 'verbal', mode: 'insensitive' } },
            { description: { contains: 'verbal', mode: 'insensitive' } },
          ],
        },
      }),
    );
  });

  it('GET supports category and search query parameters together', async () => {
    const { GET } = await import('@/app/api/publicreports/route');

    mocks.reportFindMany.mockResolvedValue([]);

    const req = new Request(
      'http://localhost:3000/api/publicreports?category=SEXUAL&search=kasus',
    );

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: [],
    });

    expect(mocks.reportFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isPublic: true,
          status: 'RESOLVED',
          category: 'SEXUAL',
          OR: [
            { title: { contains: 'kasus', mode: 'insensitive' } },
            { description: { contains: 'kasus', mode: 'insensitive' } },
          ],
        },
      }),
    );
  });

  it('GET returns empty data when no public reports exist', async () => {
    const { GET } = await import('@/app/api/publicreports/route');

    mocks.reportFindMany.mockResolvedValue([]);

    const req = new Request('http://localhost:3000/api/publicreports');

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: [],
    });
  });

  it('GET returns 500 when database query fails', async () => {
    const { GET } = await import('@/app/api/publicreports/route');

    mocks.reportFindMany.mockRejectedValue(new Error('database down'));

    const req = new Request('http://localhost:3000/api/publicreports');

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  });
});
