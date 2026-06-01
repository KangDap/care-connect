import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(),
  getPsychologistDashboard: vi.fn(),
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

vi.mock('@/modules/dashboard/dashboard.service', () => ({
  DashboardService: {
    getPsychologistDashboard: mocks.getPsychologistDashboard,
  },
}));

const mockPsychologistSession = () => {
  mocks.getSession.mockResolvedValue({
    user: {
      id: 'psy-1',
      role: 'PSYCHOLOGIST',
      name: 'Dr. A',
      email: 'psy@mail.com',
    },
  });
};

const mockUserSession = () => {
  mocks.getSession.mockResolvedValue({
    user: {
      id: 'user-1',
      role: 'USER',
      name: 'Normal User',
      email: 'user@mail.com',
    },
  });
};

describe('API Route /api/dashboard/psychologist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('GET returns 401 when unauthenticated', async () => {
    const { GET } = await import('@/app/api/dashboard/psychologist/route');

    mocks.getSession.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({
      error: 'Authentication required',
    });
  });

  it('GET returns 403 when user is not psychologist', async () => {
    const { GET } = await import('@/app/api/dashboard/psychologist/route');

    mockUserSession();

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({
      error: 'Access denied. Psychologist role required.',
    });
  });

  it('GET returns psychologist dashboard data when user is psychologist', async () => {
    const { GET } = await import('@/app/api/dashboard/psychologist/route');

    mockPsychologistSession();

    const dashboardData = {
      totalConsultations: 5,
      scheduledConsultations: 3,
      completedConsultations: 2,
      totalDonationAmount: 100000,
    };

    mocks.getPsychologistDashboard.mockResolvedValue(dashboardData);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: dashboardData,
    });

    expect(mocks.getPsychologistDashboard).toHaveBeenCalledWith('psy-1');
  });

  it('GET returns 500 when service throws unexpected error', async () => {
    const { GET } = await import('@/app/api/dashboard/psychologist/route');

    mockPsychologistSession();

    mocks.getPsychologistDashboard.mockRejectedValue(
      new Error('database down'),
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: 'Internal server error',
    });
  });
});
