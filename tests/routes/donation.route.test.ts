import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(),
  getDonationHistory: vi.fn(),
  handleDonationRequest: vi.fn(),
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

vi.mock('@/modules/donation/donation.service', () => ({
  DonationService: {
    getDonationHistory: mocks.getDonationHistory,
  },
}));

vi.mock('@/app/api/donation/_shared', () => ({
  handleDonationRequest: mocks.handleDonationRequest,
}));

const makeJsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

describe('API Route /api/donation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.headers.mockResolvedValue(
      new Headers({
        host: 'localhost:3000',
        'x-forwarded-proto': 'http',
      }),
    );
  });

  it('GET returns 401 when user is not authenticated', async () => {
    const { GET } = await import('@/app/api/donation/route');

    mocks.getSession.mockResolvedValue(null);

    const res = await GET();
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

  it('GET returns donation history for authenticated user', async () => {
    const { GET } = await import('@/app/api/donation/route');

    const donations = [
      {
        id: 1,
        amount: 50000,
        paymentStatus: 'PAID',
      },
    ];

    mocks.getSession.mockResolvedValue({
      user: {
        id: 'user-1',
      },
    });

    mocks.getDonationHistory.mockResolvedValue(donations);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: donations,
    });

    expect(mocks.getDonationHistory).toHaveBeenCalledWith('user-1');
  });

  it('GET returns ApiError response when service throws ApiError', async () => {
    const { GET } = await import('@/app/api/donation/route');
    const { Errors } = await import('@/lib/error');

    mocks.getSession.mockResolvedValue({
      user: {
        id: 'user-1',
      },
    });

    mocks.getDonationHistory.mockRejectedValue(Errors.forbidden('Not allowed'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Not allowed',
      },
    });
  });

  it('GET returns 500 when unexpected error happens', async () => {
    const { GET } = await import('@/app/api/donation/route');

    mocks.getSession.mockResolvedValue({
      user: {
        id: 'user-1',
      },
    });

    mocks.getDonationHistory.mockRejectedValue(new Error('database down'));

    const res = await GET();
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

  it('POST delegates report donation creation to shared donation handler', async () => {
    const { POST } = await import('@/app/api/donation/route');

    const responseBody = {
      success: true,
      data: {
        donation: {
          id: 1,
          amount: 50000,
        },
        payment: {
          orderId: 'ORDER-1',
          token: 'snap-token',
        },
      },
    };

    mocks.handleDonationRequest.mockResolvedValue(
      makeJsonResponse(responseBody, 201),
    );

    const req = new Request('http://localhost:3000/api/donation', {
      method: 'POST',
      body: new FormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual(responseBody);
    expect(mocks.handleDonationRequest).toHaveBeenCalledTimes(1);
  });

  it('POST returns 401 response from shared donation handler when user is not authenticated', async () => {
    const { POST } = await import('@/app/api/donation/route');

    const responseBody = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    };

    mocks.handleDonationRequest.mockResolvedValue(
      makeJsonResponse(responseBody, 401),
    );

    const req = new Request('http://localhost:3000/api/donation', {
      method: 'POST',
      body: new FormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual(responseBody);
  });

  it('POST returns 400 response from shared donation handler when validation fails', async () => {
    const { POST } = await import('@/app/api/donation/route');

    const responseBody = {
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid donation data',
      },
    };

    mocks.handleDonationRequest.mockResolvedValue(
      makeJsonResponse(responseBody, 400),
    );

    const req = new Request('http://localhost:3000/api/donation', {
      method: 'POST',
      body: new FormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual(responseBody);
  });

  it('POST returns 422 response from shared donation handler when payment creation fails', async () => {
    const { POST } = await import('@/app/api/donation/route');

    const responseBody = {
      success: false,
      error: {
        code: 'UNPROCESSABLE_ENTITY',
        message: 'Failed to create payment',
      },
    };

    mocks.handleDonationRequest.mockResolvedValue(
      makeJsonResponse(responseBody, 422),
    );

    const req = new Request('http://localhost:3000/api/donation', {
      method: 'POST',
      body: new FormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body).toEqual(responseBody);
  });

  it('POST returns 500 response from shared donation handler when unexpected error happens', async () => {
    const { POST } = await import('@/app/api/donation/route');

    const responseBody = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    };

    mocks.handleDonationRequest.mockResolvedValue(
      makeJsonResponse(responseBody, 500),
    );

    const req = new Request('http://localhost:3000/api/donation', {
      method: 'POST',
      body: new FormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual(responseBody);
  });

  it('POST propagates response returned by shared donation handler', async () => {
    const { POST } = await import('@/app/api/donation/route');

    const responseBody = {
      success: true,
      data: {
        custom: 'shared-handler-response',
      },
    };

    mocks.handleDonationRequest.mockResolvedValue(
      makeJsonResponse(responseBody, 202),
    );

    const req = new Request('http://localhost:3000/api/donation', {
      method: 'POST',
      body: new FormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(202);
    expect(body).toEqual(responseBody);
    expect(mocks.handleDonationRequest).toHaveBeenCalledTimes(1);
  });

  it('POST propagates unexpected error thrown by shared donation handler', async () => {
    const { POST } = await import('@/app/api/donation/route');

    mocks.handleDonationRequest.mockRejectedValue(
      new Error('shared handler down'),
    );

    const req = new Request('http://localhost:3000/api/donation', {
      method: 'POST',
      body: new FormData(),
    });

    await expect(POST(req)).rejects.toThrow('shared handler down');
  });
});
