import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(),
  validateScheduleQuery: vi.fn(),
  getScheduleAvailability: vi.fn(),
  validateCreateConsultation: vi.fn(),
  createConsultation: vi.fn(),
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

vi.mock('@/modules/consultation/consultation.service', () => ({
  ConsultationService: {
    validateScheduleQuery: mocks.validateScheduleQuery,
    getScheduleAvailability: mocks.getScheduleAvailability,
    validateCreateConsultation: mocks.validateCreateConsultation,
    createConsultation: mocks.createConsultation,
  },
}));

const makeConsultationFormData = () => {
  const formData = new FormData();

  formData.set('title', 'Konsultasi Kecemasan');
  formData.set('nature', 'ANXIETY');
  formData.set('description', 'Saya membutuhkan bantuan profesional.');
  formData.set('date', '2026-05-24');
  formData.set('time', '09:00');
  formData.set('isAnonymous', 'false');

  return formData;
};

describe('API Route /api/consultation', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mocks.headers.mockResolvedValue(new Headers());
  });

  it('GET returns schedule availability with success true', async () => {
    const { GET } = await import('@/app/api/consultation/route');

    mocks.validateScheduleQuery.mockReturnValue({ date: '2026-05-24' });
    mocks.getScheduleAvailability.mockResolvedValue([
      { time: '09:00', available: true },
    ]);

    const req = new Request(
      'http://localhost:3000/api/consultation?date=2026-05-24',
    );

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: [{ time: '09:00', available: true }],
    });

    expect(mocks.validateScheduleQuery).toHaveBeenCalledWith({
      date: '2026-05-24',
    });
    expect(mocks.getScheduleAvailability).toHaveBeenCalledWith('2026-05-24');
  });

  it('GET returns ApiError status when query is invalid', async () => {
    const { GET } = await import('@/app/api/consultation/route');
    const { Errors } = await import('@/lib/error');

    mocks.validateScheduleQuery.mockImplementation(() => {
      throw Errors.badRequest('Invalid date');
    });

    const req = new Request('http://localhost:3000/api/consultation');

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid date' });
  });

  it('GET returns 500 when unexpected error happens', async () => {
    const { GET } = await import('@/app/api/consultation/route');

    mocks.validateScheduleQuery.mockReturnValue({ date: '2026-05-24' });
    mocks.getScheduleAvailability.mockRejectedValue(new Error('database down'));

    const req = new Request(
      'http://localhost:3000/api/consultation?date=2026-05-24',
    );

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error' });
  });

  it('POST returns 401 when user is not authenticated', async () => {
    const { POST } = await import('@/app/api/consultation/route');

    mocks.getSession.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/consultation', {
      method: 'POST',
      body: makeConsultationFormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Authentication required' });
  });

  it('POST returns 401 when session user id is missing', async () => {
    const { POST } = await import('@/app/api/consultation/route');

    mocks.getSession.mockResolvedValue({
      user: { id: '', role: 'USER' },
    });

    const req = new Request('http://localhost:3000/api/consultation', {
      method: 'POST',
      body: makeConsultationFormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Invalid user session' });
  });

  it('POST returns 403 when psychologist tries to create consultation', async () => {
    const { POST } = await import('@/app/api/consultation/route');

    mocks.getSession.mockResolvedValue({
      user: { id: 'psy-1', role: 'PSYCHOLOGIST' },
    });

    const req = new Request('http://localhost:3000/api/consultation', {
      method: 'POST',
      body: makeConsultationFormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({
      error: 'Psychologists cannot create consultations',
    });
  });

  it('POST creates consultation successfully', async () => {
    const { POST } = await import('@/app/api/consultation/route');

    const validatedData = {
      title: 'Konsultasi Kecemasan',
      nature: 'ANXIETY',
      description: 'Saya membutuhkan bantuan profesional.',
      date: '2026-05-24',
      time: '09:00',
      isAnonymous: false,
      document: null,
    };

    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    mocks.validateCreateConsultation.mockReturnValue(validatedData);
    mocks.createConsultation.mockResolvedValue({
      id: 1,
      title: 'Konsultasi Kecemasan',
      status: 'SCHEDULED',
    });

    const req = new Request('http://localhost:3000/api/consultation', {
      method: 'POST',
      body: makeConsultationFormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        id: 1,
        title: 'Konsultasi Kecemasan',
        status: 'SCHEDULED',
      },
    });

    expect(mocks.validateCreateConsultation).toHaveBeenCalled();
    expect(mocks.createConsultation).toHaveBeenCalledWith(
      'user-1',
      validatedData,
    );
  });

  it('POST returns ApiError status when service throws ApiError', async () => {
    const { POST } = await import('@/app/api/consultation/route');
    const { ApiError } = await import('@/lib/error');

    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    mocks.validateCreateConsultation.mockReturnValue({
      title: 'Konsultasi Kecemasan',
    });

    mocks.createConsultation.mockRejectedValue(
      new ApiError(
        422,
        'UNPROCESSABLE_ENTITY',
        'Selected time slot is no longer available',
      ),
    );

    const req = new Request('http://localhost:3000/api/consultation', {
      method: 'POST',
      body: makeConsultationFormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body).toEqual({
      error: 'Selected time slot is no longer available',
    });
  });

  it('POST returns 500 when unexpected error happens', async () => {
    const { POST } = await import('@/app/api/consultation/route');

    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    mocks.validateCreateConsultation.mockImplementation(() => {
      throw new Error('unexpected error');
    });

    const req = new Request('http://localhost:3000/api/consultation', {
      method: 'POST',
      body: makeConsultationFormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error' });
  });
});
