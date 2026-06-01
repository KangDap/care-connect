import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  getSession: vi.fn(),

  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),

  reportCount: vi.fn(),
  reportGroupBy: vi.fn(),
  reportFindMany: vi.fn(),
  reportFindUnique: vi.fn(),
  reportUpdate: vi.fn(),
  reportDelete: vi.fn(),

  consultationCount: vi.fn(),
  consultationGroupBy: vi.fn(),
  consultationFindMany: vi.fn(),
  consultationUpdate: vi.fn(),
  consultationDelete: vi.fn(),

  donationAggregate: vi.fn(),
  donationCount: vi.fn(),
  donationFindMany: vi.fn(),
  donationGroupBy: vi.fn(),
  donationUpdate: vi.fn(),
  donationDelete: vi.fn(),

  chatCount: vi.fn(),
  chatDeleteMany: vi.fn(),

  channelFindUnique: vi.fn(),
  channelDelete: vi.fn(),
  channelMemberDeleteMany: vi.fn(),
  transaction: vi.fn(),

  listChannels: vi.fn(),
  createNewChannel: vi.fn(),
  updateChannel: vi.fn(),

  saveSchedules: vi.fn(),
  getSchedules: vi.fn(),
  getPsychologists: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: mocks.headers,
}));

vi.mock('next/server', () => ({
  NextRequest: Request,
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

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
    report: {
      count: mocks.reportCount,
      groupBy: mocks.reportGroupBy,
      findMany: mocks.reportFindMany,
      findUnique: mocks.reportFindUnique,
      update: mocks.reportUpdate,
      delete: mocks.reportDelete,
    },
    consultation: {
      count: mocks.consultationCount,
      groupBy: mocks.consultationGroupBy,
      findMany: mocks.consultationFindMany,
      update: mocks.consultationUpdate,
      delete: mocks.consultationDelete,
    },
    donation: {
      aggregate: mocks.donationAggregate,
      count: mocks.donationCount,
      findMany: mocks.donationFindMany,
      groupBy: mocks.donationGroupBy,
      update: mocks.donationUpdate,
      delete: mocks.donationDelete,
    },
    chat: {
      count: mocks.chatCount,
      deleteMany: mocks.chatDeleteMany,
    },
    channel: {
      findUnique: mocks.channelFindUnique,
      delete: mocks.channelDelete,
    },
    channelMember: {
      deleteMany: mocks.channelMemberDeleteMany,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock('@/modules/community-chat/community-chat.service', () => ({
  CommunityChatService: {
    listChannels: mocks.listChannels,
    createNewChannel: mocks.createNewChannel,
    updateChannel: mocks.updateChannel,
  },
}));

vi.mock('@/modules/consultation/consultation.service', () => ({
  ConsultationService: {
    saveSchedules: mocks.saveSchedules,
    getSchedules: mocks.getSchedules,
    getPsychologists: mocks.getPsychologists,
  },
}));

const mockAdminSession = () => {
  mocks.getSession.mockResolvedValue({
    user: {
      id: 'admin-1',
      role: 'ADMIN',
      name: 'Admin',
      email: 'admin@mail.com',
    },
  });
};

const mockUserSession = () => {
  mocks.getSession.mockResolvedValue({
    user: {
      id: 'user-1',
      role: 'USER',
      name: 'User',
      email: 'user@mail.com',
    },
  });
};

const expectSuccess = async (res: Response) => {
  const body = await res.json();
  expect(body.success).toBe(true);
  return body;
};

const expectFail = async (res: Response) => {
  const body = await res.json();
  expect(body.success).toBe(false);
  return body;
};

describe('Dashboard Admin Route - /api/dashboard/admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('GET returns 401 when user is not authenticated', async () => {
    const { GET } = await import('@/app/api/dashboard/admin/route');

    mocks.getSession.mockResolvedValue(null);

    const res = await GET();
    const body = await expectFail(res);

    expect(res.status).toBe(401);
    expect(body.error.message).toBe('Authentication required');
  });

  it('GET returns 403 when user is not admin', async () => {
    const { GET } = await import('@/app/api/dashboard/admin/route');

    mockUserSession();

    const res = await GET();
    const body = await expectFail(res);

    expect(res.status).toBe(403);
    expect(body.error.message).toBe('Access denied. Admin role required.');
  });

  it('GET returns admin dashboard summary data', async () => {
    const { GET } = await import('@/app/api/dashboard/admin/route');

    mockAdminSession();

    mocks.reportCount.mockResolvedValueOnce(10).mockResolvedValueOnce(4);

    mocks.reportGroupBy.mockResolvedValue([
      { status: 'PENDING', _count: { id: 4 } },
      { status: 'RESOLVED', _count: { id: 6 } },
    ]);

    mocks.consultationCount.mockResolvedValueOnce(8).mockResolvedValueOnce(3);

    mocks.consultationGroupBy.mockResolvedValue([
      { status: 'SCHEDULED', _count: { id: 3 } },
      { status: 'COMPLETED', _count: { id: 5 } },
    ]);

    mocks.donationCount.mockResolvedValue(5);

    mocks.donationAggregate
      .mockResolvedValueOnce({ _sum: { amount: 500000 } })
      .mockResolvedValueOnce({ _sum: { amount: 100000 } })
      .mockResolvedValueOnce({ _sum: { amount: 300000 } });

    mocks.donationFindMany
      .mockResolvedValueOnce([
        {
          id: 1,
          amount: 50000,
          paymentMethod: 'QRIS',
          timestamp: new Date('2026-05-25T00:00:00.000Z'),
          donationType: 'REPORT',
          user: { name: 'Niki', email: 'niki@mail.com' },
          report: { title: 'Report A' },
        },
      ])
      .mockResolvedValueOnce([
        {
          amount: 50000,
          timestamp: new Date(),
        },
      ]);

    mocks.chatCount.mockResolvedValue(20);

    const res = await GET();
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({
      totalReports: 10,
      pendingReports: 4,
      totalConsultations: 8,
      activeConsultations: 3,
      totalDonationsCount: 5,
      totalChats: 20,
    });
  });

  it('GET returns 500 when dashboard query fails', async () => {
    const { GET } = await import('@/app/api/dashboard/admin/route');

    mockAdminSession();
    mocks.reportCount.mockRejectedValue(new Error('database down'));

    const res = await GET();
    const body = await expectFail(res);

    expect(res.status).toBe(500);
    expect(body.error.message).toBe('Internal server error');
  });
});

describe('Dashboard Admin Reports Route - /api/dashboard/admin/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('GET returns report list with pagination and status counts', async () => {
    const { GET } = await import('@/app/api/dashboard/admin/reports/route');

    mockAdminSession();

    mocks.reportFindMany.mockResolvedValue([
      {
        id: 1,
        title: 'Laporan A',
        category: 'PSYCHOLOGICAL',
        status: 'PENDING',
        isAnonymous: false,
        province: 'Jawa Barat',
        city: 'Bandung',
        incidentDate: new Date('2026-01-10T00:00:00.000Z'),
        createdAt: new Date('2026-01-11T00:00:00.000Z'),
        description: 'Deskripsi laporan.',
        user: { name: 'Niki', email: 'niki@mail.com' },
        evidences: [{ id: 1 }],
        donations: [{ amount: 50000 }, { amount: 25000 }],
      },
    ]);

    mocks.reportCount.mockResolvedValue(1);
    mocks.reportGroupBy.mockResolvedValue([
      { status: 'PENDING', _count: { id: 1 } },
    ]);

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/reports?status=PENDING&page=1',
    );

    const res = await GET(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data.reports[0]).toMatchObject({
      id: 1,
      title: 'Laporan A',
      hasEvidence: true,
      donationTotal: 75000,
    });
    expect(body.data.totalCount).toBe(1);
  });

  it('GET returns 400 when status filter is invalid', async () => {
    const { GET } = await import('@/app/api/dashboard/admin/reports/route');

    mockAdminSession();

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/reports?status=WRONG',
    );

    const res = await GET(req);
    const body = await expectFail(res);

    expect(res.status).toBe(400);
    expect(body.error.message).toBe('Invalid status filter');
  });

  it('PATCH updates report status', async () => {
    const { PATCH } = await import('@/app/api/dashboard/admin/reports/route');

    mockAdminSession();

    mocks.reportFindUnique.mockResolvedValue({ id: 1 });
    mocks.reportUpdate.mockResolvedValue({
      id: 1,
      status: 'RESOLVED',
    });

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/reports',
      {
        method: 'PATCH',
        body: JSON.stringify({
          id: 1,
          status: 'RESOLVED',
        }),
      },
    );

    const res = await PATCH(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toEqual({
      id: 1,
      status: 'RESOLVED',
    });
  });

  it('PATCH returns 404 when report is not found', async () => {
    const { PATCH } = await import('@/app/api/dashboard/admin/reports/route');

    mockAdminSession();

    mocks.reportFindUnique.mockResolvedValue(null);

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/reports',
      {
        method: 'PATCH',
        body: JSON.stringify({
          id: 99,
          status: 'RESOLVED',
        }),
      },
    );

    const res = await PATCH(req);
    const body = await expectFail(res);

    expect(res.status).toBe(404);
    expect(body.error.message).toBe('Report not found');
  });

  it('DELETE deletes report by id from query parameter', async () => {
    const { DELETE } = await import('@/app/api/dashboard/admin/reports/route');

    mockAdminSession();

    mocks.reportFindUnique.mockResolvedValue({ id: 1 });
    mocks.reportDelete.mockResolvedValue({ id: 1 });

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/reports?id=1',
      {
        method: 'DELETE',
      },
    );

    const res = await DELETE(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ id: 1 });
  });
});

describe('Dashboard Admin Donations Route - /api/dashboard/admin/donations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('GET returns donation dashboard data', async () => {
    const { GET } = await import('@/app/api/dashboard/admin/donations/route');

    mockAdminSession();

    mocks.donationAggregate
      .mockResolvedValueOnce({ _sum: { amount: 100000 } })
      .mockResolvedValueOnce({ _sum: { amount: 300000 } })
      .mockResolvedValueOnce({ _sum: { amount: 500000 } });

    mocks.donationCount.mockResolvedValueOnce(10).mockResolvedValueOnce(2);

    mocks.donationFindMany.mockResolvedValue([
      {
        id: 1,
        amount: 50000,
        paymentMethod: 'QRIS',
        paymentStatus: 'PAID',
        donationType: 'REPORT',
        timestamp: new Date('2026-05-25T00:00:00.000Z'),
        user: { name: 'Niki', email: 'niki@mail.com' },
        report: { id: 1, title: 'Laporan A' },
      },
    ]);

    mocks.donationGroupBy.mockResolvedValue([
      { paymentStatus: 'PAID', _count: { id: 2 } },
    ]);

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/donations?page=1',
    );

    const res = await GET(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data.summary).toMatchObject({
      todayAmount: 100000,
      monthAmount: 300000,
      allTimeAmount: 500000,
      allTimeCount: 10,
    });
    expect(body.data.donations[0]).toMatchObject({
      id: 1,
      amount: 50000,
      paymentStatus: 'PAID',
    });
  });

  it('PATCH updates donation payment status', async () => {
    const { PATCH } = await import('@/app/api/dashboard/admin/donations/route');

    mockAdminSession();

    mocks.donationUpdate.mockResolvedValue({
      id: 1,
      paymentStatus: 'PAID',
    });

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/donations',
      {
        method: 'PATCH',
        body: JSON.stringify({
          id: 1,
          paymentStatus: 'PAID',
        }),
      },
    );

    const res = await PATCH(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({
      id: 1,
      paymentStatus: 'PAID',
    });
  });

  it('PATCH returns 400 when required fields are missing', async () => {
    const { PATCH } = await import('@/app/api/dashboard/admin/donations/route');

    mockAdminSession();

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/donations',
      {
        method: 'PATCH',
        body: JSON.stringify({}),
      },
    );

    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: 'Missing required fields',
    });
  });

  it('DELETE deletes donation by id', async () => {
    const { DELETE } =
      await import('@/app/api/dashboard/admin/donations/route');

    mockAdminSession();

    mocks.donationDelete.mockResolvedValue({ id: 1 });

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/donations?id=1',
      {
        method: 'DELETE',
      },
    );

    const res = await DELETE(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ success: true });
  });
});

describe('Dashboard Admin Consultations Route - /api/dashboard/admin/consultations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('GET returns consultation list', async () => {
    const { GET } =
      await import('@/app/api/dashboard/admin/consultations/route');

    mockAdminSession();

    mocks.consultationFindMany.mockResolvedValue([
      {
        id: 1,
        title: 'Konsultasi A',
        category: 'ANXIETY',
        status: 'SCHEDULED',
        date: new Date('2026-05-25T00:00:00.000Z'),
        isAnonymous: false,
        user: { name: 'User A', email: 'user@mail.com' },
        psychologist: { name: 'Dr. A' },
      },
    ]);
    mocks.consultationCount.mockResolvedValue(1);
    mocks.consultationGroupBy.mockResolvedValue([
      { status: 'SCHEDULED', _count: { id: 1 } },
    ]);

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/consultations?tab=active&page=1',
    );

    const res = await GET(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data.consultations[0]).toMatchObject({
      id: 1,
      title: 'Konsultasi A',
      status: 'SCHEDULED',
    });
  });

  it('PATCH updates consultation status', async () => {
    const { PATCH } =
      await import('@/app/api/dashboard/admin/consultations/route');

    mockAdminSession();

    mocks.consultationUpdate.mockResolvedValue({
      id: 1,
      status: 'COMPLETED',
    });

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/consultations',
      {
        method: 'PATCH',
        body: JSON.stringify({
          id: 1,
          status: 'COMPLETED',
        }),
      },
    );

    const res = await PATCH(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({
      id: 1,
      status: 'COMPLETED',
    });
  });

  it('DELETE deletes consultation by id', async () => {
    const { DELETE } =
      await import('@/app/api/dashboard/admin/consultations/route');

    mockAdminSession();

    mocks.consultationDelete.mockResolvedValue({ id: 1 });

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/consultations?id=1',
      {
        method: 'DELETE',
      },
    );

    const res = await DELETE(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ success: true });
  });
});

describe('Dashboard Admin Users Route - /api/dashboard/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('PATCH updates user role', async () => {
    const { PATCH } = await import('@/app/api/dashboard/admin/users/route');

    mockAdminSession();

    mocks.userUpdate.mockResolvedValue({
      id: 'user-1',
      role: 'PSYCHOLOGIST',
    });

    const req = new Request('http://localhost:3000/api/dashboard/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({
        id: 'user-1',
        action: 'role',
        payload: {
          role: 'PSYCHOLOGIST',
        },
      }),
    });

    const res = await PATCH(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toEqual({
      id: 'user-1',
      role: 'PSYCHOLOGIST',
    });
  });

  it('PATCH updates user ban status', async () => {
    const { PATCH } = await import('@/app/api/dashboard/admin/users/route');

    mockAdminSession();

    mocks.userUpdate.mockResolvedValue({
      id: 'user-1',
      banned: true,
    });

    const req = new Request('http://localhost:3000/api/dashboard/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({
        id: 'user-1',
        action: 'ban',
        payload: {
          banned: true,
          reason: 'Violation',
        },
      }),
    });

    const res = await PATCH(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toEqual({
      id: 'user-1',
      banned: true,
    });
  });

  it('PATCH returns 400 for invalid action', async () => {
    const { PATCH } = await import('@/app/api/dashboard/admin/users/route');

    mockAdminSession();

    const req = new Request('http://localhost:3000/api/dashboard/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({
        id: 'user-1',
        action: 'unknown',
        payload: {},
      }),
    });

    const res = await PATCH(req);
    const body = await expectFail(res);

    expect(res.status).toBe(400);
    expect(body.error.message).toBe('Invalid action');
  });
});

describe('Dashboard Admin Community Chat Route - /api/dashboard/admin/community-chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('GET returns community channel list', async () => {
    const { GET } =
      await import('@/app/api/dashboard/admin/community-chat/route');

    mockAdminSession();

    mocks.listChannels.mockResolvedValue([
      {
        id: 1,
        name: 'Safe Space',
      },
    ]);

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/community-chat?all=true',
    );

    const res = await GET(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toEqual([
      {
        id: 1,
        name: 'Safe Space',
      },
    ]);
  });

  it('POST creates community channel from JSON body', async () => {
    const { POST } =
      await import('@/app/api/dashboard/admin/community-chat/route');

    mockAdminSession();

    mocks.createNewChannel.mockResolvedValue({
      id: 1,
      name: 'Safe Space',
      type: 'PUBLIC',
    });

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/community-chat',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Safe Space',
          description: 'Support channel',
          type: 'PUBLIC',
          coverUrl: '',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const res = await POST(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({
      id: 1,
      name: 'Safe Space',
    });
  });

  it('PATCH updates community channel', async () => {
    const { PATCH } =
      await import('@/app/api/dashboard/admin/community-chat/route');

    mockAdminSession();

    mocks.updateChannel.mockResolvedValue({
      id: 1,
      name: 'Updated Channel',
    });

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/community-chat',
      {
        method: 'PATCH',
        body: JSON.stringify({
          id: 1,
          name: 'Updated Channel',
          coverUrl: '',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const res = await PATCH(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({
      id: 1,
      name: 'Updated Channel',
    });
  });

  it('DELETE deletes community channel', async () => {
    const { DELETE } =
      await import('@/app/api/dashboard/admin/community-chat/route');

    mockAdminSession();

    mocks.channelFindUnique.mockResolvedValue({ id: 1 });
    mocks.transaction.mockResolvedValue([]);

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/community-chat?id=1',
      {
        method: 'DELETE',
      },
    );

    const res = await DELETE(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ id: 1 });
  });
});

describe('Dashboard Admin Schedules Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('POST saves psychologist schedules', async () => {
    const { POST } = await import('@/app/api/dashboard/admin/schedules/route');

    mockAdminSession();

    mocks.saveSchedules.mockResolvedValue([
      {
        id: 1,
        dayOfWeek: 1,
      },
    ]);

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/schedules',
      {
        method: 'POST',
        body: JSON.stringify({
          userId: 'psy-1',
          slots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }],
        }),
      },
    );

    const res = await POST(req);
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toEqual([
      {
        id: 1,
        dayOfWeek: 1,
      },
    ]);
  });

  it('POST returns 400 when required fields are missing', async () => {
    const { POST } = await import('@/app/api/dashboard/admin/schedules/route');

    mockAdminSession();

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/schedules',
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );

    const res = await POST(req);
    const body = await expectFail(res);

    expect(res.status).toBe(400);
    expect(body.error.message).toBe('UserId and slots array are required');
  });

  it('GET /schedules/psychologists returns psychologist list', async () => {
    const { GET } =
      await import('@/app/api/dashboard/admin/schedules/psychologists/route');

    mockAdminSession();

    mocks.getPsychologists.mockResolvedValue([
      {
        id: 'psy-1',
        name: 'Dr. A',
      },
    ]);

    const res = await GET();
    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toEqual([
      {
        id: 'psy-1',
        name: 'Dr. A',
      },
    ]);
  });

  it('GET /schedules/[id] returns psychologist schedules by id', async () => {
    const { GET } =
      await import('@/app/api/dashboard/admin/schedules/[id]/route');

    mockAdminSession();

    mocks.getSchedules.mockResolvedValue([
      {
        id: 1,
        dayOfWeek: 1,
      },
    ]);

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/schedules/psy-1',
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: 'psy-1' }),
    });

    const body = await expectSuccess(res);

    expect(res.status).toBe(200);
    expect(body.data).toEqual([
      {
        id: 1,
        dayOfWeek: 1,
      },
    ]);
  });
});

describe('Dashboard Admin AI Analyze Route - /api/dashboard/admin/ai/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    vi.unstubAllGlobals();
  });

  it('POST returns 401 when unauthenticated', async () => {
    const { POST } = await import('@/app/api/dashboard/admin/ai/analyze/route');

    mocks.getSession.mockResolvedValue(null);

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/ai/analyze',
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({
      error: 'Authentication required',
    });
  });

  it('POST returns 403 when user is not admin', async () => {
    const { POST } = await import('@/app/api/dashboard/admin/ai/analyze/route');

    mockUserSession();

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/ai/analyze',
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({
      error: 'Admin role required to access AI analysis',
    });
  });

  it('POST forwards request to AI service and returns result', async () => {
    const { POST } = await import('@/app/api/dashboard/admin/ai/analyze/route');

    mockAdminSession();

    const aiResult = {
      status: 'success',
      processed_count: 2,
      transaction_count: 10,
      frequent_itemsets_count: 3,
      rules_count: 2,
      duration_ms: 12.5,
      api_payload: {},
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(aiResult),
      }),
    );

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/ai/analyze',
      {
        method: 'POST',
        body: JSON.stringify({
          reports: [
            {
              report_id: 1,
              title: 'Laporan A',
              description: 'Deskripsi laporan A',
            },
          ],
          text_columns: ['title', 'description'],
        }),
      },
    );

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: aiResult,
    });
  });

  it('POST returns 500 when AI service returns error', async () => {
    const { POST } = await import('@/app/api/dashboard/admin/ai/analyze/route');

    mockAdminSession();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(JSON.stringify({ detail: 'AI down' })),
      }),
    );

    const req = new Request(
      'http://localhost:3000/api/dashboard/admin/ai/analyze',
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('AI Service returned 500');
  });
});
