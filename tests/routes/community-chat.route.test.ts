import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  getSession: vi.fn(),

  listChannels: vi.fn(),
  createNewChannel: vi.fn(),
  getChannelDetails: vi.fn(),

  joinChannel: vi.fn(),
  leaveChannel: vi.fn(),

  postMessage: vi.fn(),

  kickUserFromChannel: vi.fn(),
  changeUserRole: vi.fn(),
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
        headers: {
          'Content-Type': 'application/json',
        },
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

vi.mock('@/modules/community-chat/community-chat.service', () => ({
  CommunityChatService: {
    listChannels: mocks.listChannels,
    createNewChannel: mocks.createNewChannel,
    getChannelDetails: mocks.getChannelDetails,

    joinChannel: mocks.joinChannel,
    leaveChannel: mocks.leaveChannel,

    postMessage: mocks.postMessage,

    kickUserFromChannel: mocks.kickUserFromChannel,
    changeUserRole: mocks.changeUserRole,
  },
}));

const mockUserSession = () => {
  mocks.getSession.mockResolvedValue({
    user: {
      id: 'user-1',
      role: 'USER',
      name: 'Niki',
      email: 'niki@mail.com',
    },
  });
};

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

describe('API Route /api/community-chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('GET returns community channel list', async () => {
    const { GET } = await import('@/app/api/community-chat/route');

    mockUserSession();

    const channels = [
      {
        id: 1,
        name: 'Physical Abuse Support',
        description: 'Ruang dukungan untuk penyintas kekerasan fisik.',
        type: 'PUBLIC',
        memberCount: 10,
      },
    ];

    mocks.listChannels.mockResolvedValue(channels);

    const req = new Request('http://localhost:3000/api/community-chat');

    const res = await GET(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(channels);
    expect(mocks.listChannels).toHaveBeenCalledWith('user-1', false);
  });

  it('GET supports all=true query parameter', async () => {
    const { GET } = await import('@/app/api/community-chat/route');

    mockAdminSession();

    const channels = [
      {
        id: 1,
        name: 'Safe Space',
        type: 'PUBLIC',
      },
    ];

    mocks.listChannels.mockResolvedValue(channels);

    const req = new Request(
      'http://localhost:3000/api/community-chat?all=true',
    );

    const res = await GET(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(channels);
    expect(mocks.listChannels).toHaveBeenCalledWith('admin-1', true);
  });

  it('GET returns 500 when list channel service fails', async () => {
    const { GET } = await import('@/app/api/community-chat/route');

    mockUserSession();

    mocks.listChannels.mockRejectedValue(new Error('database down'));

    const req = new Request('http://localhost:3000/api/community-chat');

    const res = await GET(req as never);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: 'Internal Server Error',
    });
  });

  it('POST returns 401 when user is not authenticated', async () => {
    const { POST } = await import('@/app/api/community-chat/route');

    mocks.getSession.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/community-chat', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Safe Space',
        description: 'Support channel',
        type: 'PUBLIC',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({
      error: 'Unauthorized',
    });
  });

  it('POST creates new community channel with JSON body', async () => {
    const { POST } = await import('@/app/api/community-chat/route');

    mockAdminSession();

    const createdChannel = {
      id: 1,
      name: 'Safe Space',
      description: 'Support channel',
      type: 'PUBLIC',
    };

    mocks.createNewChannel.mockResolvedValue(createdChannel);

    const req = new Request('http://localhost:3000/api/community-chat', {
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
    });

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual(createdChannel);

    expect(mocks.createNewChannel).toHaveBeenCalledWith(
      'admin-1',
      'ADMIN',
      expect.objectContaining({
        name: 'Safe Space',
        description: 'Support channel',
        type: 'PUBLIC',
      }),
    );
  });

  it('POST creates new community channel with FormData body', async () => {
    const { POST } = await import('@/app/api/community-chat/route');

    mockAdminSession();

    const createdChannel = {
      id: 2,
      name: 'Form Channel',
      type: 'PUBLIC',
    };

    mocks.createNewChannel.mockResolvedValue(createdChannel);

    const formData = new FormData();
    formData.set('name', 'Form Channel');
    formData.set('description', 'Created from form data');
    formData.set('type', 'PUBLIC');

    const req = new Request('http://localhost:3000/api/community-chat', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual(createdChannel);

    expect(mocks.createNewChannel).toHaveBeenCalledWith(
      'admin-1',
      'ADMIN',
      expect.objectContaining({
        name: 'Form Channel',
        description: 'Created from form data',
        type: 'PUBLIC',
      }),
    );
  });

  it('POST returns 500 when create channel service fails', async () => {
    const { POST } = await import('@/app/api/community-chat/route');

    mockAdminSession();

    mocks.createNewChannel.mockRejectedValue(new Error('create failed'));

    const req = new Request('http://localhost:3000/api/community-chat', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Safe Space',
        description: 'Support channel',
        type: 'PUBLIC',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: 'Internal Server Error',
    });
  });
});

describe('API Route /api/community-chat/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('GET returns 401 when user is not authenticated', async () => {
    const { GET } = await import('@/app/api/community-chat/[id]/route');

    mocks.getSession.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/community-chat/1');

    const res = await GET(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({
      error: 'Unauthorized',
    });
  });

  it('GET returns 400 when channel id is invalid', async () => {
    const { GET } = await import('@/app/api/community-chat/[id]/route');

    mockUserSession();

    const req = new Request('http://localhost:3000/api/community-chat/abc');

    const res = await GET(req as never, {
      params: Promise.resolve({ id: 'abc' }),
    });

    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: 'Invalid channel ID',
    });
  });

  it('GET returns channel details', async () => {
    const { GET } = await import('@/app/api/community-chat/[id]/route');

    mockUserSession();

    const channel = {
      id: 1,
      name: 'Safe Space',
      description: 'Support channel',
      type: 'PUBLIC',
      members: [],
    };

    mocks.getChannelDetails.mockResolvedValue(channel);

    const req = new Request('http://localhost:3000/api/community-chat/1');

    const res = await GET(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(channel);
    expect(mocks.getChannelDetails).toHaveBeenCalledWith(1, 'user-1');
  });

  it('GET returns 500 when get channel details service fails', async () => {
    const { GET } = await import('@/app/api/community-chat/[id]/route');

    mockUserSession();

    mocks.getChannelDetails.mockRejectedValue(new Error('database down'));

    const req = new Request('http://localhost:3000/api/community-chat/1');

    const res = await GET(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: 'Internal Server Error',
    });
  });
});

describe('API Route /api/community-chat/[id]/join', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('POST returns 401 when user is not authenticated', async () => {
    const { POST } = await import('@/app/api/community-chat/[id]/join/route');

    mocks.getSession.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/community-chat/1/join', {
      method: 'POST',
    });

    const res = await POST(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({
      error: 'Unauthorized',
    });
  });

  it('POST returns 400 when channel id is invalid', async () => {
    const { POST } = await import('@/app/api/community-chat/[id]/join/route');

    mockUserSession();

    const req = new Request(
      'http://localhost:3000/api/community-chat/abc/join',
      {
        method: 'POST',
      },
    );

    const res = await POST(req as never, {
      params: Promise.resolve({ id: 'abc' }),
    });

    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: 'Invalid channel ID',
    });
  });

  it('POST joins channel successfully', async () => {
    const { POST } = await import('@/app/api/community-chat/[id]/join/route');

    mockUserSession();

    mocks.joinChannel.mockResolvedValue(undefined);

    const req = new Request('http://localhost:3000/api/community-chat/1/join', {
      method: 'POST',
    });

    const res = await POST(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'Joined channel',
    });

    expect(mocks.joinChannel).toHaveBeenCalledWith('user-1', 1);
  });

  it('POST returns 500 when join service fails', async () => {
    const { POST } = await import('@/app/api/community-chat/[id]/join/route');

    mockUserSession();

    mocks.joinChannel.mockRejectedValue(new Error('already joined'));

    const req = new Request('http://localhost:3000/api/community-chat/1/join', {
      method: 'POST',
    });

    const res = await POST(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: 'Internal Server Error',
    });
  });

  it('DELETE leaves channel through join route', async () => {
    const { DELETE } = await import('@/app/api/community-chat/[id]/join/route');

    mockUserSession();

    mocks.leaveChannel.mockResolvedValue(undefined);

    const req = new Request('http://localhost:3000/api/community-chat/1/join', {
      method: 'DELETE',
    });

    const res = await DELETE(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'Left channel',
    });

    expect(mocks.leaveChannel).toHaveBeenCalledWith('user-1', 1);
  });
});

describe('API Route /api/community-chat/[id]/leave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('POST returns 401 when user is not authenticated', async () => {
    const { POST } = await import('@/app/api/community-chat/[id]/leave/route');

    mocks.getSession.mockResolvedValue(null);

    const req = new Request(
      'http://localhost:3000/api/community-chat/1/leave',
      {
        method: 'POST',
      },
    );

    const res = await POST(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({
      error: 'Unauthorized',
    });
  });

  it('POST leaves channel successfully', async () => {
    const { POST } = await import('@/app/api/community-chat/[id]/leave/route');

    mockUserSession();

    mocks.leaveChannel.mockResolvedValue(undefined);

    const req = new Request(
      'http://localhost:3000/api/community-chat/1/leave',
      {
        method: 'POST',
      },
    );

    const res = await POST(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'Left channel',
    });

    expect(mocks.leaveChannel).toHaveBeenCalledWith('user-1', 1);
  });

  it('POST returns 400 when channel id is invalid', async () => {
    const { POST } = await import('@/app/api/community-chat/[id]/leave/route');

    mockUserSession();

    const req = new Request(
      'http://localhost:3000/api/community-chat/abc/leave',
      {
        method: 'POST',
      },
    );

    const res = await POST(req as never, {
      params: Promise.resolve({ id: 'abc' }),
    });

    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: 'Invalid channel ID',
    });
  });
});

describe('API Route /api/community-chat/[id]/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('POST returns 401 when user is not authenticated', async () => {
    const { POST } =
      await import('@/app/api/community-chat/[id]/messages/route');

    mocks.getSession.mockResolvedValue(null);

    const formData = new FormData();
    formData.set('content', 'Halo semua');

    const req = new Request(
      'http://localhost:3000/api/community-chat/1/messages',
      {
        method: 'POST',
        body: formData,
      },
    );

    const res = await POST(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({
      error: 'Unauthorized',
    });
  });

  it('POST returns 400 when channel id is invalid', async () => {
    const { POST } =
      await import('@/app/api/community-chat/[id]/messages/route');

    mockUserSession();

    const formData = new FormData();
    formData.set('content', 'Halo semua');

    const req = new Request(
      'http://localhost:3000/api/community-chat/abc/messages',
      {
        method: 'POST',
        body: formData,
      },
    );

    const res = await POST(req as never, {
      params: Promise.resolve({ id: 'abc' }),
    });

    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: 'Invalid channel ID',
    });
  });

  it('POST sends message successfully', async () => {
    const { POST } =
      await import('@/app/api/community-chat/[id]/messages/route');

    mockUserSession();

    const message = {
      id: 1,
      channelId: 1,
      content: 'Halo semua',
      userId: 'user-1',
      isAnonymous: false,
    };

    mocks.postMessage.mockResolvedValue(message);

    const formData = new FormData();
    formData.set('content', 'Halo semua');
    formData.set('isAnonymous', 'false');

    const req = new Request(
      'http://localhost:3000/api/community-chat/1/messages',
      {
        method: 'POST',
        body: formData,
      },
    );

    const res = await POST(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual(message);

    expect(mocks.postMessage).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        channelId: 1,
        content: 'Halo semua',
        isAnonymous: false,
        replyToId: null,
        media: null,
      }),
    );
  });

  it('POST sends anonymous reply message successfully', async () => {
    const { POST } =
      await import('@/app/api/community-chat/[id]/messages/route');

    mockUserSession();

    const message = {
      id: 2,
      channelId: 1,
      content: 'Halo anonim',
      userId: 'user-1',
      isAnonymous: true,
      replyToId: 5,
    };

    mocks.postMessage.mockResolvedValue(message);

    const formData = new FormData();
    formData.set('content', 'Halo anonim');
    formData.set('isAnonymous', 'true');
    formData.set('replyToId', '5');

    const req = new Request(
      'http://localhost:3000/api/community-chat/1/messages',
      {
        method: 'POST',
        body: formData,
      },
    );

    const res = await POST(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual(message);

    expect(mocks.postMessage).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        channelId: 1,
        content: 'Halo anonim',
        isAnonymous: true,
        replyToId: 5,
      }),
    );
  });

  it('POST returns 500 when post message service fails', async () => {
    const { POST } =
      await import('@/app/api/community-chat/[id]/messages/route');

    mockUserSession();

    mocks.postMessage.mockRejectedValue(new Error('banned user'));

    const formData = new FormData();
    formData.set('content', 'Halo semua');

    const req = new Request(
      'http://localhost:3000/api/community-chat/1/messages',
      {
        method: 'POST',
        body: formData,
      },
    );

    const res = await POST(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: 'Internal Server Error',
    });
  });
});

describe('API Route /api/community-chat/[id]/kick', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('DELETE returns 401 when user is not authenticated', async () => {
    const { DELETE } = await import('@/app/api/community-chat/[id]/kick/route');

    mocks.getSession.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/community-chat/1/kick', {
      method: 'DELETE',
      body: JSON.stringify({
        userId: 'user-2',
      }),
    });

    const res = await DELETE(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({
      error: 'Unauthorized',
    });
  });

  it('DELETE returns 400 when target userId is missing', async () => {
    const { DELETE } = await import('@/app/api/community-chat/[id]/kick/route');

    mockAdminSession();

    const req = new Request('http://localhost:3000/api/community-chat/1/kick', {
      method: 'DELETE',
      body: JSON.stringify({}),
    });

    const res = await DELETE(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: 'Missing userId to kick',
    });
  });

  it('DELETE returns 400 when channel id is invalid', async () => {
    const { DELETE } = await import('@/app/api/community-chat/[id]/kick/route');

    mockAdminSession();

    const req = new Request(
      'http://localhost:3000/api/community-chat/abc/kick',
      {
        method: 'DELETE',
        body: JSON.stringify({
          userId: 'user-2',
        }),
      },
    );

    const res = await DELETE(req as never, {
      params: Promise.resolve({ id: 'abc' }),
    });

    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: 'Invalid channel ID',
    });
  });

  it('DELETE kicks user successfully', async () => {
    const { DELETE } = await import('@/app/api/community-chat/[id]/kick/route');

    mockAdminSession();

    mocks.kickUserFromChannel.mockResolvedValue(undefined);

    const req = new Request('http://localhost:3000/api/community-chat/1/kick', {
      method: 'DELETE',
      body: JSON.stringify({
        userId: 'user-2',
      }),
    });

    const res = await DELETE(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'User kicked',
    });

    expect(mocks.kickUserFromChannel).toHaveBeenCalledWith(
      'admin-1',
      'ADMIN',
      'user-2',
      1,
    );
  });

  it('DELETE returns 500 when kick service fails', async () => {
    const { DELETE } = await import('@/app/api/community-chat/[id]/kick/route');

    mockAdminSession();

    mocks.kickUserFromChannel.mockRejectedValue(new Error('not allowed'));

    const req = new Request('http://localhost:3000/api/community-chat/1/kick', {
      method: 'DELETE',
      body: JSON.stringify({
        userId: 'user-2',
      }),
    });

    const res = await DELETE(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: 'Internal Server Error',
    });
  });
});

describe('API Route /api/community-chat/[id]/role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it('PATCH returns 401 when user is not authenticated', async () => {
    const { PATCH } = await import('@/app/api/community-chat/[id]/role/route');

    mocks.getSession.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/community-chat/1/role', {
      method: 'PATCH',
      body: JSON.stringify({
        userId: 'user-2',
        role: 'MODERATOR',
      }),
    });

    const res = await PATCH(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({
      error: 'Unauthorized',
    });
  });

  it('PATCH returns 400 when userId or role is missing', async () => {
    const { PATCH } = await import('@/app/api/community-chat/[id]/role/route');

    mockAdminSession();

    const req = new Request('http://localhost:3000/api/community-chat/1/role', {
      method: 'PATCH',
      body: JSON.stringify({
        userId: 'user-2',
      }),
    });

    const res = await PATCH(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: 'Missing userId or role',
    });
  });

  it('PATCH returns 400 when channel id is invalid', async () => {
    const { PATCH } = await import('@/app/api/community-chat/[id]/role/route');

    mockAdminSession();

    const req = new Request(
      'http://localhost:3000/api/community-chat/abc/role',
      {
        method: 'PATCH',
        body: JSON.stringify({
          userId: 'user-2',
          role: 'MODERATOR',
        }),
      },
    );

    const res = await PATCH(req as never, {
      params: Promise.resolve({ id: 'abc' }),
    });

    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      error: 'Invalid channel ID',
    });
  });

  it('PATCH changes user role successfully', async () => {
    const { PATCH } = await import('@/app/api/community-chat/[id]/role/route');

    mockAdminSession();

    mocks.changeUserRole.mockResolvedValue(undefined);

    const req = new Request('http://localhost:3000/api/community-chat/1/role', {
      method: 'PATCH',
      body: JSON.stringify({
        userId: 'user-2',
        role: 'MODERATOR',
      }),
    });

    const res = await PATCH(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'Role updated',
    });

    expect(mocks.changeUserRole).toHaveBeenCalledWith(
      'admin-1',
      'ADMIN',
      'user-2',
      1,
      'MODERATOR',
    );
  });

  it('PATCH returns 500 when change role service fails', async () => {
    const { PATCH } = await import('@/app/api/community-chat/[id]/role/route');

    mockAdminSession();

    mocks.changeUserRole.mockRejectedValue(new Error('invalid role'));

    const req = new Request('http://localhost:3000/api/community-chat/1/role', {
      method: 'PATCH',
      body: JSON.stringify({
        userId: 'user-2',
        role: 'OWNER',
      }),
    });

    const res = await PATCH(req as never, {
      params: Promise.resolve({ id: '1' }),
    });

    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: 'Internal Server Error',
    });
  });
});
