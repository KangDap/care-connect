import { CommunityChatService } from '@/modules/community-chat/community-chat.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  repository: {
    getAllChannels: vi.fn(),
    checkMembership: vi.fn(),
    getUnreadCount: vi.fn(),
    getJoinedChannels: vi.fn(),
    getChannelById: vi.fn(),
    updateLastViewed: vi.fn(),
    getChannelMessages: vi.fn(),
    getChannelMembers: vi.fn(),
    addMember: vi.fn(),
    getUserById: vi.fn(),
    sendMessage: vi.fn(),
    removeMember: vi.fn(),
    updateMemberRole: vi.fn(),
    createChannel: vi.fn(),
    updateChannel: vi.fn(),
  },
  getSupabaseClient: vi.fn(),
}));

vi.mock('@/modules/community-chat/community-chat.repositories', () => ({
  CommunityChatRepository: mocks.repository,
}));

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
}));

const channel = (id: number, timestamp: Date) => ({
  id,
  name: `Channel ${id}`,
  createdAt: timestamp,
  chats: [{ timestamp }],
});

describe('CommunityChatService', () => {
  beforeEach(() => {
    Object.values(mocks.repository).forEach((mock) => mock.mockReset());
    mocks.getSupabaseClient.mockReset();
  });

  it('lists all channels sorted by latest activity for guest user', async () => {
    mocks.repository.getAllChannels.mockResolvedValue([
      channel(1, new Date('2026-01-01T00:00:00Z')),
      channel(2, new Date('2026-02-01T00:00:00Z')),
    ]);

    const result = await CommunityChatService.listChannels();

    expect(result.map((c) => c.id)).toEqual([2, 1]);
  });

  it('adds membership and unread count when listing all channels for logged in user', async () => {
    mocks.repository.getAllChannels.mockResolvedValue([
      channel(1, new Date('2026-01-01T00:00:00Z')),
    ]);

    mocks.repository.checkMembership.mockResolvedValue({
      role: 'MEMBER',
      lastViewedAt: new Date('2025-12-01T00:00:00Z'),
    });

    mocks.repository.getUnreadCount.mockResolvedValue(3);

    const result = await CommunityChatService.listChannels('user-1', true);

    expect(result[0]).toMatchObject({
      isMember: true,
      myRole: 'MEMBER',
      unreadCount: 3,
    });

    expect(mocks.repository.checkMembership).toHaveBeenCalledWith('user-1', 1);
    expect(mocks.repository.getUnreadCount).toHaveBeenCalledWith(
      1,
      new Date('2025-12-01T00:00:00Z'),
    );
  });

  it('does not count banned user as member when listing all channels', async () => {
    mocks.repository.getAllChannels.mockResolvedValue([
      channel(1, new Date('2026-01-01T00:00:00Z')),
    ]);

    mocks.repository.checkMembership.mockResolvedValue({
      role: 'BANNED',
      lastViewedAt: new Date(),
    });

    const result = await CommunityChatService.listChannels('user-1', true);

    expect(result[0]).toMatchObject({
      isMember: false,
      myRole: 'BANNED',
      unreadCount: 0,
    });

    expect(mocks.repository.getUnreadCount).not.toHaveBeenCalled();
  });

  it('returns joined channels with unread count sorted by latest message', async () => {
    mocks.repository.getJoinedChannels.mockResolvedValue([
      {
        ...channel(1, new Date('2026-01-01T00:00:00Z')),
        members: [
          {
            role: 'MEMBER',
            lastViewedAt: new Date('2025-12-01T00:00:00Z'),
          },
        ],
      },
      {
        ...channel(2, new Date('2026-03-01T00:00:00Z')),
        members: [
          {
            role: 'OWNER',
            lastViewedAt: new Date('2026-02-01T00:00:00Z'),
          },
        ],
      },
    ]);

    mocks.repository.getUnreadCount
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    const result = await CommunityChatService.listChannels('user-1');

    expect(result.map((c) => c.id)).toEqual([2, 1]);
    expect(result[0]).toMatchObject({
      isMember: true,
      myRole: 'OWNER',
      unreadCount: 0,
    });
    expect(result[1]).toMatchObject({
      isMember: true,
      myRole: 'MEMBER',
      unreadCount: 1,
    });
  });

  it('gets channel details, updates lastViewedAt, and enriches message roles', async () => {
    mocks.repository.getChannelById.mockResolvedValue({
      id: 1,
      name: 'Safe Space',
    });

    mocks.repository.checkMembership.mockResolvedValue({
      userId: 'user-1',
      role: 'MEMBER',
    });

    mocks.repository.getChannelMessages.mockResolvedValue([
      {
        id: 1,
        user: { id: 'user-1' },
        content: 'Halo',
      },
      {
        id: 2,
        user: { id: 'mod-1' },
        content: 'Selamat datang',
      },
    ]);

    mocks.repository.getChannelMembers.mockResolvedValue([
      {
        userId: 'user-1',
        role: 'MEMBER',
      },
      {
        userId: 'mod-1',
        role: 'MODERATOR',
      },
    ]);

    const result = await CommunityChatService.getChannelDetails(1, 'user-1');

    expect(mocks.repository.updateLastViewed).toHaveBeenCalledWith('user-1', 1);
    expect(result.messages.map((message) => message.roleInChannel)).toEqual([
      'MEMBER',
      'MODERATOR',
    ]);
    expect(result).toMatchObject({
      id: 1,
      name: 'Safe Space',
      isMember: true,
      myRole: 'MEMBER',
    });
  });

  it('does not update lastViewedAt if member is banned', async () => {
    mocks.repository.getChannelById.mockResolvedValue({
      id: 1,
      name: 'Safe Space',
    });

    mocks.repository.checkMembership.mockResolvedValue({
      userId: 'user-1',
      role: 'BANNED',
    });

    mocks.repository.getChannelMessages.mockResolvedValue([]);
    mocks.repository.getChannelMembers.mockResolvedValue([]);

    const result = await CommunityChatService.getChannelDetails(1, 'user-1');

    expect(mocks.repository.updateLastViewed).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      isMember: false,
      myRole: 'BANNED',
      messages: [],
    });
  });

  it('throws notFound when channel detail does not exist', async () => {
    mocks.repository.getChannelById.mockResolvedValue(null);

    await expect(
      CommunityChatService.getChannelDetails(99, 'user-1'),
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('joins channel and records system join message', async () => {
    mocks.repository.getChannelById.mockResolvedValue({
      id: 1,
    });

    mocks.repository.checkMembership.mockResolvedValue(null);

    mocks.repository.addMember.mockResolvedValue({
      userId: 'user-1',
      channelId: 1,
      role: 'MEMBER',
    });

    mocks.repository.getUserById.mockResolvedValue({
      name: 'Niki',
    });

    const result = await CommunityChatService.joinChannel('user-1', 1);

    expect(result.role).toBe('MEMBER');
    expect(mocks.repository.addMember).toHaveBeenCalledWith(
      'user-1',
      1,
      'MEMBER',
    );
    expect(mocks.repository.sendMessage).toHaveBeenCalledWith('user-1', {
      channelId: 1,
      content: 'Niki joined the channel',
      isSystem: true,
    });
  });

  it('throws notFound when joining non-existing channel', async () => {
    mocks.repository.getChannelById.mockResolvedValue(null);

    await expect(
      CommunityChatService.joinChannel('user-1', 99),
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('blocks banned user from rejoining a channel', async () => {
    mocks.repository.getChannelById.mockResolvedValue({
      id: 1,
    });

    mocks.repository.checkMembership.mockResolvedValue({
      role: 'BANNED',
    });

    await expect(
      CommunityChatService.joinChannel('user-1', 1),
    ).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('prevents duplicate channel membership', async () => {
    mocks.repository.getChannelById.mockResolvedValue({
      id: 1,
    });

    mocks.repository.checkMembership.mockResolvedValue({
      role: 'MEMBER',
    });

    await expect(
      CommunityChatService.joinChannel('user-1', 1),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
    });
  });

  it('leaves channel and records system leave message', async () => {
    mocks.repository.checkMembership.mockResolvedValue({
      role: 'MEMBER',
    });

    mocks.repository.getUserById.mockResolvedValue({
      name: 'Niki',
    });

    mocks.repository.removeMember.mockResolvedValue({
      userId: 'user-1',
      channelId: 1,
    });

    const result = await CommunityChatService.leaveChannel('user-1', 1);

    expect(result).toEqual({
      userId: 'user-1',
      channelId: 1,
    });

    expect(mocks.repository.sendMessage).toHaveBeenCalledWith('user-1', {
      channelId: 1,
      content: 'Niki left the channel',
      isSystem: true,
    });

    expect(mocks.repository.removeMember).toHaveBeenCalledWith('user-1', 1);
  });

  it('prevents non-member from leaving channel', async () => {
    mocks.repository.checkMembership.mockResolvedValue(null);

    await expect(
      CommunityChatService.leaveChannel('user-1', 1),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
    });
  });

  it('prevents banned member from leaving channel', async () => {
    mocks.repository.checkMembership.mockResolvedValue({
      role: 'BANNED',
    });

    await expect(
      CommunityChatService.leaveChannel('user-1', 1),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
    });
  });

  it('posts message when user is member', async () => {
    mocks.repository.checkMembership.mockResolvedValue({
      role: 'MEMBER',
    });

    mocks.repository.sendMessage.mockResolvedValue({
      id: 1,
      content: 'Halo',
    });

    mocks.getSupabaseClient.mockReturnValue(null);

    const result = await CommunityChatService.postMessage('user-1', {
      channelId: 1,
      content: 'Halo',
      isAnonymous: false,
    });

    expect(result.content).toBe('Halo');
    expect(mocks.repository.updateLastViewed).toHaveBeenCalledWith('user-1', 1);
    expect(mocks.repository.sendMessage).toHaveBeenCalledWith('user-1', {
      channelId: 1,
      content: 'Halo',
      isAnonymous: false,
      mediaUrl: null,
    });
  });

  it('prevents non-member from posting message', async () => {
    mocks.repository.checkMembership.mockResolvedValue(null);

    await expect(
      CommunityChatService.postMessage('user-1', {
        channelId: 1,
        content: 'Halo',
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('prevents banned member from posting message', async () => {
    mocks.repository.checkMembership.mockResolvedValue({
      role: 'BANNED',
    });

    await expect(
      CommunityChatService.postMessage('user-1', {
        channelId: 1,
        content: 'Halo',
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('uploads community chat media when file exists', async () => {
    const upload = vi.fn().mockResolvedValue({
      error: null,
    });

    const getPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl: 'https://cdn.test/media.png',
      },
    });

    const from = vi.fn().mockReturnValue({
      upload,
      getPublicUrl,
    });

    const media = new File(['image'], 'media.png', {
      type: 'image/png',
    });

    mocks.repository.checkMembership.mockResolvedValue({
      role: 'MEMBER',
    });

    mocks.getSupabaseClient.mockReturnValue({
      storage: {
        from,
      },
    });

    mocks.repository.sendMessage.mockResolvedValue({
      id: 1,
      mediaUrl: 'https://cdn.test/media.png',
    });

    const result = await CommunityChatService.postMessage('user-1', {
      channelId: 1,
      content: '',
      media,
    });

    expect(result.mediaUrl).toBe('https://cdn.test/media.png');
    expect(from).toHaveBeenCalledWith('community-chat-files');
    expect(upload).toHaveBeenCalled();
    expect(getPublicUrl).toHaveBeenCalled();

    expect(mocks.repository.sendMessage).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        mediaUrl: 'https://cdn.test/media.png',
      }),
    );
  });

  it('throws storage error when community chat media upload fails', async () => {
    const upload = vi.fn().mockResolvedValue({
      error: {
        message: 'bucket error',
      },
    });

    const getPublicUrl = vi.fn();

    const from = vi.fn().mockReturnValue({
      upload,
      getPublicUrl,
    });

    const media = new File(['image'], 'media.png', {
      type: 'image/png',
    });

    mocks.repository.checkMembership.mockResolvedValue({
      role: 'MEMBER',
    });

    mocks.getSupabaseClient.mockReturnValue({
      storage: {
        from,
      },
    });

    await expect(
      CommunityChatService.postMessage('user-1', {
        channelId: 1,
        content: '',
        media,
      }),
    ).rejects.toMatchObject({
      status: 500,
      code: 'STORAGE_ERROR',
    });

    expect(mocks.repository.sendMessage).not.toHaveBeenCalled();
  });

  it('only allows admin to create new channel', async () => {
    await expect(
      CommunityChatService.createNewChannel('user-1', 'USER', {
        name: 'Safe Space',
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('creates channel and makes admin the owner', async () => {
    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.repository.createChannel.mockResolvedValue({
      id: 10,
      name: 'Safe Space',
    });

    const result = await CommunityChatService.createNewChannel(
      'admin-1',
      'ADMIN',
      {
        name: 'Safe Space',
        type: 'PUBLIC',
      },
    );

    expect(result.id).toBe(10);

    expect(mocks.repository.createChannel).toHaveBeenCalledWith({
      name: 'Safe Space',
      type: 'PUBLIC',
      coverUrl: undefined,
    });

    expect(mocks.repository.addMember).toHaveBeenCalledWith(
      'admin-1',
      10,
      'OWNER',
    );
  });

  it('uploads cover image when admin creates channel with coverImage', async () => {
    const upload = vi.fn().mockResolvedValue({
      error: null,
    });

    const getPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl: 'https://cdn.test/cover.png',
      },
    });

    const from = vi.fn().mockReturnValue({
      upload,
      getPublicUrl,
    });

    const coverImage = new File(['image'], 'cover.png', {
      type: 'image/png',
    });

    mocks.getSupabaseClient.mockReturnValue({
      storage: {
        from,
      },
    });

    mocks.repository.createChannel.mockResolvedValue({
      id: 10,
      name: 'Safe Space',
      coverUrl: 'https://cdn.test/cover.png',
    });

    const result = await CommunityChatService.createNewChannel(
      'admin-1',
      'ADMIN',
      {
        name: 'Safe Space',
        type: 'PUBLIC',
        coverImage,
      },
    );

    expect(result.id).toBe(10);
    expect(from).toHaveBeenCalledWith('community-chat-profile');
    expect(upload).toHaveBeenCalled();

    expect(mocks.repository.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        coverUrl: 'https://cdn.test/cover.png',
      }),
    );

    expect(mocks.repository.addMember).toHaveBeenCalledWith(
      'admin-1',
      10,
      'OWNER',
    );
  });

  it('throws storage error when creating channel cover upload fails', async () => {
    const coverImage = new File(['image'], 'cover.png', {
      type: 'image/png',
    });

    const upload = vi.fn().mockResolvedValue({
      error: {
        message: 'upload failed',
      },
    });

    const getPublicUrl = vi.fn();

    const from = vi.fn().mockReturnValue({
      upload,
      getPublicUrl,
    });

    mocks.getSupabaseClient.mockReturnValue({
      storage: {
        from,
      },
    });

    await expect(
      CommunityChatService.createNewChannel('admin-1', 'ADMIN', {
        name: 'Safe Space',
        type: 'PUBLIC',
        coverImage,
      }),
    ).rejects.toMatchObject({
      status: 500,
      code: 'STORAGE_ERROR',
    });

    expect(mocks.repository.createChannel).not.toHaveBeenCalled();
    expect(mocks.repository.addMember).not.toHaveBeenCalled();
  });

  it('allows admin to update channel', async () => {
    mocks.repository.getChannelById.mockResolvedValue({
      id: 1,
      name: 'Old Channel',
    });

    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.repository.updateChannel.mockResolvedValue({
      id: 1,
      name: 'Updated Channel',
    });

    const result = await CommunityChatService.updateChannel(
      'admin-1',
      'ADMIN',
      1,
      {
        name: 'Updated Channel',
      },
    );

    expect(result.name).toBe('Updated Channel');

    expect(mocks.repository.updateChannel).toHaveBeenCalledWith(1, {
      name: 'Updated Channel',
      coverUrl: undefined,
    });
  });

  it('allows channel owner to update channel', async () => {
    mocks.repository.checkMembership.mockResolvedValue({
      role: 'OWNER',
    });

    mocks.repository.getChannelById.mockResolvedValue({
      id: 1,
      name: 'Old Channel',
    });

    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.repository.updateChannel.mockResolvedValue({
      id: 1,
      name: 'Updated by Owner',
    });

    const result = await CommunityChatService.updateChannel(
      'owner-1',
      'USER',
      1,
      {
        name: 'Updated by Owner',
      },
    );

    expect(result.name).toBe('Updated by Owner');
  });

  it('prevents non-owner non-admin from updating channel', async () => {
    mocks.repository.checkMembership.mockResolvedValue({
      role: 'MEMBER',
    });

    await expect(
      CommunityChatService.updateChannel('user-1', 'USER', 1, {
        name: 'Illegal Update',
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('throws notFound when updating non-existing channel', async () => {
    mocks.repository.getChannelById.mockResolvedValue(null);

    await expect(
      CommunityChatService.updateChannel('admin-1', 'ADMIN', 99, {
        name: 'New Name',
      }),
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('uploads new cover image when updating channel', async () => {
    const coverImage = new File(['image'], 'updated-cover.png', {
      type: 'image/png',
    });

    const upload = vi.fn().mockResolvedValue({
      error: null,
    });

    const getPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl: 'https://cdn.test/updated-cover.png',
      },
    });

    const from = vi.fn().mockReturnValue({
      upload,
      getPublicUrl,
    });

    mocks.repository.getChannelById.mockResolvedValue({
      id: 1,
      name: 'Old Channel',
    });

    mocks.getSupabaseClient.mockReturnValue({
      storage: {
        from,
      },
    });

    mocks.repository.updateChannel.mockResolvedValue({
      id: 1,
      name: 'Updated Channel',
      coverUrl: 'https://cdn.test/updated-cover.png',
    });

    const result = await CommunityChatService.updateChannel(
      'admin-1',
      'ADMIN',
      1,
      {
        name: 'Updated Channel',
        coverImage,
      },
    );

    expect(result.coverUrl).toBe('https://cdn.test/updated-cover.png');
    expect(from).toHaveBeenCalledWith('community-chat-profile');
    expect(upload).toHaveBeenCalled();

    expect(mocks.repository.updateChannel).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        name: 'Updated Channel',
        coverUrl: 'https://cdn.test/updated-cover.png',
      }),
    );
  });

  it('throws storage error when updating channel cover upload fails', async () => {
    const coverImage = new File(['image'], 'broken-cover.png', {
      type: 'image/png',
    });

    const upload = vi.fn().mockResolvedValue({
      error: {
        message: 'upload failed',
      },
    });

    const getPublicUrl = vi.fn();

    const from = vi.fn().mockReturnValue({
      upload,
      getPublicUrl,
    });

    mocks.repository.getChannelById.mockResolvedValue({
      id: 1,
      name: 'Old Channel',
    });

    mocks.getSupabaseClient.mockReturnValue({
      storage: {
        from,
      },
    });

    await expect(
      CommunityChatService.updateChannel('admin-1', 'ADMIN', 1, {
        name: 'Updated Channel',
        coverImage,
      }),
    ).rejects.toMatchObject({
      status: 500,
      code: 'STORAGE_ERROR',
    });

    expect(mocks.repository.updateChannel).not.toHaveBeenCalled();
  });

  it('updates channel with existing coverUrl when no new cover image is uploaded', async () => {
    mocks.repository.getChannelById.mockResolvedValue({
      id: 1,
      name: 'Old Channel',
    });

    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.repository.updateChannel.mockResolvedValue({
      id: 1,
      name: 'Updated Channel',
      coverUrl: 'https://cdn.test/existing-cover.png',
    });

    const result = await CommunityChatService.updateChannel(
      'admin-1',
      'ADMIN',
      1,
      {
        name: 'Updated Channel',
        coverUrl: 'https://cdn.test/existing-cover.png',
      },
    );

    expect(result.coverUrl).toBe('https://cdn.test/existing-cover.png');

    expect(mocks.repository.updateChannel).toHaveBeenCalledWith(1, {
      name: 'Updated Channel',
      coverUrl: 'https://cdn.test/existing-cover.png',
    });
  });

  it('allows owner to kick member and changes target role to BANNED', async () => {
    mocks.repository.checkMembership
      .mockResolvedValueOnce({
        role: 'OWNER',
      })
      .mockResolvedValueOnce({
        role: 'MEMBER',
      });

    mocks.repository.getUserById
      .mockResolvedValueOnce({
        name: 'Owner',
      })
      .mockResolvedValueOnce({
        name: 'Member',
      });

    mocks.repository.updateMemberRole.mockResolvedValue({
      userId: 'member-1',
      role: 'BANNED',
    });

    const result = await CommunityChatService.kickUserFromChannel(
      'owner-1',
      'USER',
      'member-1',
      1,
    );

    expect(result.role).toBe('BANNED');
    expect(mocks.repository.updateMemberRole).toHaveBeenCalledWith(
      'member-1',
      1,
      'BANNED',
    );
    expect(mocks.repository.sendMessage).toHaveBeenCalledWith('owner-1', {
      channelId: 1,
      content: 'Member was kicked by Owner',
      isSystem: true,
    });
  });

  it('allows moderator to kick member', async () => {
    mocks.repository.checkMembership
      .mockResolvedValueOnce({
        role: 'MODERATOR',
      })
      .mockResolvedValueOnce({
        role: 'MEMBER',
      });

    mocks.repository.getUserById
      .mockResolvedValueOnce({
        name: 'Moderator',
      })
      .mockResolvedValueOnce({
        name: 'Member',
      });

    mocks.repository.updateMemberRole.mockResolvedValue({
      userId: 'member-1',
      role: 'BANNED',
    });

    const result = await CommunityChatService.kickUserFromChannel(
      'mod-1',
      'USER',
      'member-1',
      1,
    );

    expect(result.role).toBe('BANNED');
  });

  it('allows global admin to kick owner', async () => {
    mocks.repository.checkMembership
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        role: 'OWNER',
      });

    mocks.repository.getUserById
      .mockResolvedValueOnce({
        name: 'Admin',
      })
      .mockResolvedValueOnce({
        name: 'Owner',
      });

    mocks.repository.updateMemberRole.mockResolvedValue({
      userId: 'owner-1',
      role: 'BANNED',
    });

    const result = await CommunityChatService.kickUserFromChannel(
      'admin-1',
      'ADMIN',
      'owner-1',
      1,
    );

    expect(result.role).toBe('BANNED');
  });

  it('prevents user from kicking themself', async () => {
    await expect(
      CommunityChatService.kickUserFromChannel('user-1', 'ADMIN', 'user-1', 1),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
    });
  });

  it('prevents moderator from kicking owner', async () => {
    mocks.repository.checkMembership
      .mockResolvedValueOnce({
        role: 'MODERATOR',
      })
      .mockResolvedValueOnce({
        role: 'OWNER',
      });

    await expect(
      CommunityChatService.kickUserFromChannel('mod-1', 'USER', 'owner-1', 1),
    ).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('throws notFound when target user is not member during kick', async () => {
    mocks.repository.checkMembership
      .mockResolvedValueOnce({
        role: 'OWNER',
      })
      .mockResolvedValueOnce(null);

    await expect(
      CommunityChatService.kickUserFromChannel(
        'owner-1',
        'USER',
        'target-1',
        1,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('throws notFound when target user is already banned during kick', async () => {
    mocks.repository.checkMembership
      .mockResolvedValueOnce({
        role: 'OWNER',
      })
      .mockResolvedValueOnce({
        role: 'BANNED',
      });

    await expect(
      CommunityChatService.kickUserFromChannel(
        'owner-1',
        'USER',
        'target-1',
        1,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('allows owner to change member role and records system message', async () => {
    mocks.repository.checkMembership
      .mockResolvedValueOnce({
        role: 'OWNER',
      })
      .mockResolvedValueOnce({
        role: 'MEMBER',
      });

    mocks.repository.updateMemberRole.mockResolvedValue({
      userId: 'member-1',
      channelId: 1,
      role: 'MODERATOR',
    });

    mocks.repository.getUserById
      .mockResolvedValueOnce({
        name: 'Owner User',
      })
      .mockResolvedValueOnce({
        name: 'Member User',
      });

    const result = await CommunityChatService.changeUserRole(
      'owner-1',
      'USER',
      'member-1',
      1,
      'MODERATOR',
    );

    expect(result).toEqual({
      userId: 'member-1',
      channelId: 1,
      role: 'MODERATOR',
    });

    expect(mocks.repository.updateMemberRole).toHaveBeenCalledWith(
      'member-1',
      1,
      'MODERATOR',
    );

    expect(mocks.repository.sendMessage).toHaveBeenCalledWith('owner-1', {
      channelId: 1,
      content: 'Role Member User was changed to MODERATOR by Owner User',
      isSystem: true,
    });
  });

  it('allows global admin to change member role without channel owner membership', async () => {
    mocks.repository.checkMembership
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        role: 'MEMBER',
      });

    mocks.repository.updateMemberRole.mockResolvedValue({
      userId: 'member-1',
      channelId: 1,
      role: 'OWNER',
    });

    mocks.repository.getUserById
      .mockResolvedValueOnce({
        name: 'Global Admin',
      })
      .mockResolvedValueOnce({
        name: 'Member User',
      });

    const result = await CommunityChatService.changeUserRole(
      'admin-1',
      'ADMIN',
      'member-1',
      1,
      'OWNER',
    );

    expect(result.role).toBe('OWNER');

    expect(mocks.repository.updateMemberRole).toHaveBeenCalledWith(
      'member-1',
      1,
      'OWNER',
    );
  });

  it('prevents normal member from changing user role', async () => {
    mocks.repository.checkMembership.mockResolvedValueOnce({
      role: 'MEMBER',
    });

    await expect(
      CommunityChatService.changeUserRole(
        'user-1',
        'USER',
        'member-1',
        1,
        'MODERATOR',
      ),
    ).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });

    expect(mocks.repository.updateMemberRole).not.toHaveBeenCalled();
  });

  it('throws notFound when changing role of user who is not a channel member', async () => {
    mocks.repository.checkMembership
      .mockResolvedValueOnce({
        role: 'OWNER',
      })
      .mockResolvedValueOnce(null);

    await expect(
      CommunityChatService.changeUserRole(
        'owner-1',
        'USER',
        'target-1',
        1,
        'MEMBER',
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });

    expect(mocks.repository.updateMemberRole).not.toHaveBeenCalled();
  });

  it('prevents owner from changing role of banned user', async () => {
    mocks.repository.checkMembership
      .mockResolvedValueOnce({
        role: 'OWNER',
      })
      .mockResolvedValueOnce({
        role: 'BANNED',
      });

    await expect(
      CommunityChatService.changeUserRole(
        'owner-1',
        'USER',
        'banned-1',
        1,
        'MEMBER',
      ),
    ).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });

    expect(mocks.repository.updateMemberRole).not.toHaveBeenCalled();
  });

  it('allows global admin to change role of banned user', async () => {
    mocks.repository.checkMembership
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        role: 'BANNED',
      });

    mocks.repository.updateMemberRole.mockResolvedValue({
      userId: 'banned-1',
      channelId: 1,
      role: 'MEMBER',
    });

    mocks.repository.getUserById
      .mockResolvedValueOnce({
        name: 'Global Admin',
      })
      .mockResolvedValueOnce({
        name: 'Banned User',
      });

    const result = await CommunityChatService.changeUserRole(
      'admin-1',
      'ADMIN',
      'banned-1',
      1,
      'MEMBER',
    );

    expect(result.role).toBe('MEMBER');

    expect(mocks.repository.updateMemberRole).toHaveBeenCalledWith(
      'banned-1',
      1,
      'MEMBER',
    );
  });

  it('uses fallback names when role change system message users are missing', async () => {
    mocks.repository.checkMembership
      .mockResolvedValueOnce({
        role: 'OWNER',
      })
      .mockResolvedValueOnce({
        role: 'MEMBER',
      });

    mocks.repository.updateMemberRole.mockResolvedValue({
      userId: 'member-1',
      channelId: 1,
      role: 'MODERATOR',
    });

    mocks.repository.getUserById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await CommunityChatService.changeUserRole(
      'owner-1',
      'USER',
      'member-1',
      1,
      'MODERATOR',
    );

    expect(mocks.repository.sendMessage).toHaveBeenCalledWith('owner-1', {
      channelId: 1,
      content: 'Role A user was changed to MODERATOR by Admin',
      isSystem: true,
    });
  });
});
