import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(),
  validateCreateReport: vi.fn(),
  createReport: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: mocks.headers,
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  },
}));

vi.mock('@/lib/auth/auth', () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock('@/modules/report/report.service', () => ({
  ReportService: {
    validateCreateReport: mocks.validateCreateReport,
    createReport: mocks.createReport,
  },
}));

const makeReportFormData = () => {
  const formData = new FormData();

  formData.set('title', 'Laporan Kekerasan Verbal');
  formData.set('category', 'PSYCHOLOGICAL');
  formData.set('incidentDate', '2026-01-10');
  formData.set('province', 'Jawa Barat');
  formData.set('city', 'Bandung');
  formData.set('district', 'Coblong');
  formData.set('address', 'Jl. Aman No. 1');
  formData.set(
    'description',
    'Korban mengalami kekerasan verbal secara berulang.',
  );

  return formData;
};

describe('API Route /api/report', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mocks.headers.mockResolvedValue(new Headers());
  });

  it('POST returns 401 when user is not authenticated', async () => {
    const { POST } = await import('@/app/api/report/route');

    mocks.getSession.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/report', {
      method: 'POST',
      body: makeReportFormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  });

  it('POST returns 401 when user id is missing', async () => {
    const { POST } = await import('@/app/api/report/route');

    mocks.getSession.mockResolvedValue({
      user: { id: '' },
    });

    const req = new Request('http://localhost:3000/api/report', {
      method: 'POST',
      body: makeReportFormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid user session',
      },
    });
  });

  it('POST creates report and returns 201', async () => {
    const { POST } = await import('@/app/api/report/route');

    const validatedData = {
      title: 'Laporan Kekerasan Verbal',
      category: 'PSYCHOLOGICAL',
      incidentDate: new Date('2026-01-10'),
      province: 'Jawa Barat',
      city: 'Bandung',
      district: 'Coblong',
      address: 'Jl. Aman No. 1',
      description: 'Korban mengalami kekerasan verbal secara berulang.',
      isAnonymous: false,
      evidence: [],
    };

    const report = {
      id: 1,
      title: 'Laporan Kekerasan Verbal',
      category: 'PSYCHOLOGICAL',
      status: 'PENDING',
      incidentDate: new Date('2026-01-10'),
      createdAt: new Date('2026-01-11'),
    };

    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    mocks.validateCreateReport.mockReturnValue(validatedData);
    mocks.createReport.mockResolvedValue(report);

    const req = new Request('http://localhost:3000/api/report', {
      method: 'POST',
      body: makeReportFormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      id: 1,
      title: 'Laporan Kekerasan Verbal',
      category: 'PSYCHOLOGICAL',
      status: 'PENDING',
    });

    expect(mocks.validateCreateReport).toHaveBeenCalled();
    expect(mocks.createReport).toHaveBeenCalledWith('user-1', validatedData);
  });

  it('POST returns ApiError when validation fails', async () => {
    const { POST } = await import('@/app/api/report/route');
    const { Errors } = await import('@/lib/error');

    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    mocks.validateCreateReport.mockImplementation(() => {
      throw Errors.badRequest('Report validation failed');
    });

    const req = new Request('http://localhost:3000/api/report', {
      method: 'POST',
      body: makeReportFormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Report validation failed',
      },
    });

    expect(mocks.createReport).not.toHaveBeenCalled();
  });

  it('POST returns ApiError when service throws ApiError', async () => {
    const { POST } = await import('@/app/api/report/route');
    const { ApiError } = await import('@/lib/error');

    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    mocks.validateCreateReport.mockReturnValue({ title: 'Report' });

    mocks.createReport.mockRejectedValue(
      new ApiError(500, 'STORAGE_ERROR', 'Failed to upload evidence'),
    );

    const req = new Request('http://localhost:3000/api/report', {
      method: 'POST',
      body: makeReportFormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'STORAGE_ERROR',
        message: 'Failed to upload evidence',
      },
    });
  });

  it('POST returns 500 when unexpected error happens', async () => {
    const { POST } = await import('@/app/api/report/route');

    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    mocks.validateCreateReport.mockImplementation(() => {
      throw new Error('unexpected error');
    });

    const req = new Request('http://localhost:3000/api/report', {
      method: 'POST',
      body: makeReportFormData(),
    });

    const res = await POST(req);
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
