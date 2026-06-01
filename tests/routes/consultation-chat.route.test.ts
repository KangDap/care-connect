import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getConsultationMessages: vi.fn(),
  sendConsultationMessage: vi.fn(),
  consultationFindMany: vi.fn(),
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

vi.mock('@/lib/prisma', () => ({
  prisma: {
    consultation: {
      findMany: mocks.consultationFindMany,
    },
  },
}));

vi.mock('@/modules/consultation-chat/consultation-chat.service', () => ({
  getConsultationMessages: mocks.getConsultationMessages,
  sendConsultationMessage: mocks.sendConsultationMessage,
}));

describe('API Route /api/consultation-chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 401 when unauthenticated', async () => {
    const { GET } = await import('@/app/api/consultation-chat/route');

    mocks.getSession.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/consultation-chat');

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('GET returns messages when consultationId exists', async () => {
    const { GET } = await import('@/app/api/consultation-chat/route');

    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    mocks.getConsultationMessages.mockResolvedValue({
      messages: [{ id: 1, content: 'Halo' }],
      isExpired: false,
    });

    const req = new Request(
      'http://localhost:3000/api/consultation-chat?consultationId=1',
    );

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      messages: [{ id: 1, content: 'Halo' }],
      isExpired: false,
    });

    expect(mocks.getConsultationMessages).toHaveBeenCalledWith(1, 'user-1');
  });

  it('GET returns active consultations sorted with latestChat', async () => {
    const { GET } = await import('@/app/api/consultation-chat/route');

    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    mocks.consultationFindMany.mockResolvedValue([
      {
        id: 1,
        status: 'SCHEDULED',
        date: new Date('2026-05-25'),
        time: new Date('2026-05-25T09:00:00.000Z'),
        createdAt: new Date('2026-05-20'),
        chats: [
          {
            timestamp: new Date('2026-05-25T10:00:00.000Z'),
            content: 'Pesan terbaru',
          },
        ],
      },
    ]);

    const req = new Request('http://localhost:3000/api/consultation-chat');

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body[0]).toMatchObject({
      id: 1,
      latestChat: {
        content: 'Pesan terbaru',
      },
    });
  });

  it('POST sends consultation chat message', async () => {
    const { POST } = await import('@/app/api/consultation-chat/route');

    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    mocks.sendConsultationMessage.mockResolvedValue({
      id: 1,
      content: 'Halo dok',
    });

    const formData = new FormData();
    formData.set('consultationId', '1');
    formData.set('content', 'Halo dok');
    formData.set('isAnonymous', 'false');

    const req = new Request('http://localhost:3000/api/consultation-chat', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      id: 1,
      content: 'Halo dok',
    });

    expect(mocks.sendConsultationMessage).toHaveBeenCalledWith('user-1', {
      consultationId: 1,
      content: 'Halo dok',
      isAnonymous: false,
      media: null,
      replyToId: null,
    });
  });

  it('POST returns 400 when consultationId is missing', async () => {
    const { POST } = await import('@/app/api/consultation-chat/route');

    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const formData = new FormData();
    formData.set('content', 'Halo dok');

    const req = new Request('http://localhost:3000/api/consultation-chat', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Missing consultationId' });
  });

  it('POST returns 401 when unauthenticated', async () => {
    const { POST } = await import('@/app/api/consultation-chat/route');

    mocks.getSession.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/consultation-chat', {
      method: 'POST',
      body: new FormData(),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });
});
