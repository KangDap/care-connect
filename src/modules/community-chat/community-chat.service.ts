import { Errors } from '@/lib/error';
import { getSupabaseClient } from '@/lib/supabase';

import { CommunityChatRepository } from './community-chat.repositories';
import { CreateChannelDTO, SendMessageDTO } from './community-chat.types';

export const CommunityChatService = {
  async listChannels(userId?: string, all: boolean = false) {
    if (!userId || all) {
      const channels = await CommunityChatRepository.getAllChannels();

      // Sort by latest activity
      const sortedChannels = channels.sort((a, b) => {
        const timeA = a.chats[0]?.timestamp.getTime() ?? a.createdAt.getTime();
        const timeB = b.chats[0]?.timestamp.getTime() ?? b.createdAt.getTime();
        return timeB - timeA;
      });

      if (!userId) return sortedChannels;

      const channelsWithMembership = await Promise.all(
        sortedChannels.map(async (channel) => {
          const membership = await CommunityChatRepository.checkMembership(
            userId,
            channel.id,
          );

          let unreadCount = 0;
          if (membership && membership.role !== 'BANNED') {
            unreadCount = await CommunityChatRepository.getUnreadCount(
              channel.id,
              membership.lastViewedAt,
            );
          }

          return {
            ...channel,
            isMember: !!membership && membership.role !== 'BANNED',
            myRole: membership?.role || null,
            unreadCount,
          };
        }),
      );

      return channelsWithMembership;
    }

    // Default: Return only joined channels
    const joinedChannels =
      await CommunityChatRepository.getJoinedChannels(userId);

    const sortedJoined = await Promise.all(
      joinedChannels.map(async (channel) => {
        const membership = channel.members?.[0];
        const lastViewed = membership?.lastViewedAt || new Date(0);

        const unreadCount = await CommunityChatRepository.getUnreadCount(
          channel.id,
          lastViewed,
        );

        return {
          ...channel,
          isMember: true,
          myRole: membership?.role || null,
          unreadCount,
        };
      }),
    );

    return sortedJoined.sort((a, b) => {
      const timeA = a.chats[0]?.timestamp.getTime() ?? a.createdAt.getTime();
      const timeB = b.chats[0]?.timestamp.getTime() ?? b.createdAt.getTime();
      return timeB - timeA;
    });
  },

  async getChannelDetails(channelId: number, userId: string) {
    const channel = await CommunityChatRepository.getChannelById(channelId);
    if (!channel) throw Errors.notFound('Channel not found');

    const membership = await CommunityChatRepository.checkMembership(
      userId,
      channelId,
    );

    // Update last viewed when opening channel
    if (membership && membership.role !== 'BANNED') {
      await CommunityChatRepository.updateLastViewed(userId, channelId);
    }

    const messages =
      await CommunityChatRepository.getChannelMessages(channelId);

    const members = await CommunityChatRepository.getChannelMembers(channelId);
    const memberRoleMap = new Map();
    for (const m of members) {
      memberRoleMap.set(m.userId, m.role);
    }

    const enrichedMessages = messages.map((msg) => ({
      ...msg,
      roleInChannel: memberRoleMap.get(msg.user.id) || 'MEMBER',
    }));

    return {
      ...channel,
      isMember: !!membership && membership.role !== 'BANNED',
      myRole: membership?.role || null,
      messages: enrichedMessages,
    };
  },

  async joinChannel(userId: string, channelId: number) {
    const channel = await CommunityChatRepository.getChannelById(channelId);
    if (!channel) throw Errors.notFound('Channel not found');

    const existingMembership = await CommunityChatRepository.checkMembership(
      userId,
      channelId,
    );

    if (existingMembership) {
      if (existingMembership.role === 'BANNED') {
        throw Errors.forbidden('You have been banned from this channel');
      }
      throw Errors.badRequest('You are already a member of this channel');
    }

    const member = await CommunityChatRepository.addMember(
      userId,
      channelId,
      'MEMBER',
    );

    // Record system message for JOIN
    const user = await CommunityChatRepository.getUserById(userId);
    await CommunityChatRepository.sendMessage(userId, {
      channelId,
      content: `${user?.name || 'A user'} joined the channel`,
      isSystem: true,
    });

    return member;
  },

  async leaveChannel(userId: string, channelId: number) {
    const membership = await CommunityChatRepository.checkMembership(
      userId,
      channelId,
    );
    if (!membership || membership.role === 'BANNED')
      throw Errors.badRequest('You are not a member of this channel');

    // Record system message for LEAVE
    const user = await CommunityChatRepository.getUserById(userId);
    await CommunityChatRepository.sendMessage(userId, {
      channelId,
      content: `${user?.name || 'A user'} left the channel`,
      isSystem: true,
    });

    return CommunityChatRepository.removeMember(userId, channelId);
  },

  async postMessage(userId: string, data: SendMessageDTO) {
    const membership = await CommunityChatRepository.checkMembership(
      userId,
      data.channelId,
    );
    if (!membership || membership.role === 'BANNED')
      throw Errors.forbidden('You must join the channel to send messages');

    // Handle file upload if present
    let finalMediaUrl = data.mediaUrl || null;
    const supabase = getSupabaseClient();

    if (data.media && supabase) {
      const fileExt = data.media.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const fileData = await data.media.arrayBuffer();

      const { error } = await supabase.storage
        .from('community-chat-files')
        .upload(fileName, fileData, {
          contentType: data.media.type,
        });

      if (error) {
        console.error('Community chat file upload error:', error);
        throw Errors.storage('Failed to upload file');
      }

      const { data: publicUrl } = supabase.storage
        .from('community-chat-files')
        .getPublicUrl(fileName);

      finalMediaUrl = publicUrl.publicUrl;
    }

    // Update last viewed on send
    await CommunityChatRepository.updateLastViewed(userId, data.channelId);

    return CommunityChatRepository.sendMessage(userId, {
      ...data,
      mediaUrl: finalMediaUrl,
    });
  },

  async changeUserRole(
    adminId: string,
    adminRole: string,
    targetUserId: string,
    channelId: number,
    newRole: 'OWNER' | 'MODERATOR' | 'MEMBER' | 'BANNED',
  ) {
    const callerMembership = await CommunityChatRepository.checkMembership(
      adminId,
      channelId,
    );

    const isGlobalAdmin = adminRole === 'ADMIN';
    const isOwner = callerMembership?.role === 'OWNER';

    if (!isGlobalAdmin && !isOwner) {
      throw Errors.forbidden(
        'Only channel owners or global admins can change roles',
      );
    }

    const targetMembership = await CommunityChatRepository.checkMembership(
      targetUserId,
      channelId,
    );
    if (!targetMembership) {
      throw Errors.notFound('User is not a member of this channel');
    }

    // Pastikan user yang sudah di-ban tidak bisa diubah role-nya oleh siapapun kecuali Global Admin
    if (targetMembership.role === 'BANNED' && !isGlobalAdmin) {
      throw Errors.forbidden(
        'Tidak dapat mengubah role pengguna yang sedang diblokir. Hanya Admin Global yang dapat melakukannya.',
      );
    }

    const member = await CommunityChatRepository.updateMemberRole(
      targetUserId,
      channelId,
      newRole,
    );

    // Kirim pesan sistem tentang perubahan role
    const admin = await CommunityChatRepository.getUserById(adminId);
    const target = await CommunityChatRepository.getUserById(targetUserId);
    await CommunityChatRepository.sendMessage(adminId, {
      channelId,
      content: `Role ${target?.name || 'A user'} was changed to ${newRole} by ${admin?.name || 'Admin'}`,
      isSystem: true,
    });

    return member;
  },

  async createNewChannel(
    adminId: string,
    userRole: string,
    data: CreateChannelDTO,
  ) {
    if (userRole !== 'ADMIN')
      throw Errors.forbidden('Only admins can create channels');

    let finalCoverUrl = data.coverUrl || null;
    const supabase = getSupabaseClient();

    if (data.coverImage && supabase) {
      const fileExt = data.coverImage.name.split('.').pop();
      const fileName = `channel-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const fileData = await data.coverImage.arrayBuffer();

      const { error } = await supabase.storage
        .from('community-chat-profile')
        .upload(fileName, fileData, {
          contentType: data.coverImage.type,
        });

      if (error) {
        console.error('Community channel profile upload error:', error);
        throw Errors.storage('Failed to upload cover image');
      }

      const { data: publicUrl } = supabase.storage
        .from('community-chat-profile')
        .getPublicUrl(fileName);

      finalCoverUrl = publicUrl.publicUrl;
    }

    const channel = await CommunityChatRepository.createChannel({
      ...data,
      coverUrl: finalCoverUrl || undefined,
    });

    // Admin becomes the OWNER of the created channel
    await CommunityChatRepository.addMember(adminId, channel.id, 'OWNER');

    return channel;
  },

  async kickUserFromChannel(
    adminId: string,
    adminRole: string,
    targetUserId: string,
    channelId: number,
  ) {
    if (adminId === targetUserId) {
      throw Errors.badRequest('You cannot kick yourself');
    }

    const callerMembership = await CommunityChatRepository.checkMembership(
      adminId,
      channelId,
    );
    const targetMembership = await CommunityChatRepository.checkMembership(
      targetUserId,
      channelId,
    );

    if (!targetMembership || targetMembership.role === 'BANNED') {
      throw Errors.notFound('User is not a member of this channel');
    }

    const isGlobalAdmin = adminRole === 'ADMIN';
    const isOwner = callerMembership?.role === 'OWNER';
    const isModerator = callerMembership?.role === 'MODERATOR';

    // Global Admin can kick anyone
    let canKick = isGlobalAdmin;

    // Owner can kick Moderator and Member
    if (isOwner && targetMembership.role !== 'OWNER') {
      canKick = true;
    }

    // Moderator can kick Member
    if (isModerator && targetMembership.role === 'MEMBER') {
      canKick = true;
    }

    if (!canKick) {
      throw Errors.forbidden('You do not have permission to kick this user');
    }

    // Kirim pesan sistem untuk KICK
    const admin = await CommunityChatRepository.getUserById(adminId);
    const target = await CommunityChatRepository.getUserById(targetUserId);
    await CommunityChatRepository.sendMessage(adminId, {
      channelId,
      content: `${target?.name || 'Seorang pengguna'} telah dikeluarkan dari forum oleh ${admin?.name || 'Admin'}`,
      isSystem: true,
    });

    // Move to BANNED role instead of deleting to prevent rejoin
    return CommunityChatRepository.updateMemberRole(
      targetUserId,
      channelId,
      'BANNED',
    );
  },
};
