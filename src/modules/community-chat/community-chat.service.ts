import { ApiError, Errors } from '@/lib/error';
import { getSupabaseClient } from '@/lib/supabase';

import { CommunityChatRepository } from './community-chat.repositories';
import { CreateChannelDTO, SendMessageDTO } from './community-chat.types';

export const CommunityChatService = {
  async listChannels(userId?: string) {
    const channels = await CommunityChatRepository.getAllChannels();

    // Sort by latest activity (last message timestamp)
    const sortedChannels = channels.sort((a, b) => {
      const timeA = a.chats[0]?.timestamp.getTime() ?? a.createdAt.getTime();
      const timeB = b.chats[0]?.timestamp.getTime() ?? b.createdAt.getTime();
      return timeB - timeA;
    });

    if (!userId) return sortedChannels;

    // If userId provided, check if user is member of each channel
    const channelsWithMembership = await Promise.all(
      sortedChannels.map(async (channel) => {
        const membership = await CommunityChatRepository.checkMembership(
          userId,
          channel.id,
        );
        return {
          ...channel,
          isMember: !!membership,
          myRole: membership?.role || null,
        };
      }),
    );

    return channelsWithMembership;
  },

  async getChannelDetails(channelId: number, userId: string) {
    const channel = await CommunityChatRepository.getChannelById(channelId);
    if (!channel) throw Errors.notFound('Channel not found');

    const membership = await CommunityChatRepository.checkMembership(
      userId,
      channelId,
    );
    const messages =
      await CommunityChatRepository.getChannelMessages(channelId);

    return {
      ...channel,
      isMember: !!membership,
      myRole: membership?.role || null,
      messages,
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
      throw Errors.badRequest('You are already a member of this channel');
    }

    // Users always join as MEMBER
    return CommunityChatRepository.addMember(userId, channelId, 'MEMBER');
  },

  async leaveChannel(userId: string, channelId: number) {
    const membership = await CommunityChatRepository.checkMembership(
      userId,
      channelId,
    );
    if (!membership)
      throw Errors.badRequest('You are not a member of this channel');

    return CommunityChatRepository.removeMember(userId, channelId);
  },

  async postMessage(userId: string, data: SendMessageDTO) {
    const membership = await CommunityChatRepository.checkMembership(
      userId,
      data.channelId,
    );
    if (!membership)
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
    newRole: 'OWNER' | 'MODERATOR' | 'MEMBER',
  ) {
    if (adminRole !== 'ADMIN')
      throw Errors.forbidden('Only admins can change roles');

    const targetMembership = await CommunityChatRepository.checkMembership(
      targetUserId,
      channelId,
    );
    if (!targetMembership)
      throw Errors.notFound('User is not a member of this channel');

    return CommunityChatRepository.updateMemberRole(
      targetUserId,
      channelId,
      newRole,
    );
  },

  async createNewChannel(
    adminId: string,
    userRole: string,
    data: CreateChannelDTO,
  ) {
    if (userRole !== 'ADMIN')
      throw Errors.forbidden('Only admins can create channels');

    const channel = await CommunityChatRepository.createChannel(data);

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
    if (adminRole !== 'ADMIN')
      throw Errors.forbidden('Only admins can kick users');

    if (adminId === targetUserId) {
      throw Errors.badRequest('You cannot kick yourself');
    }

    const targetMembership = await CommunityChatRepository.checkMembership(
      targetUserId,
      channelId,
    );
    if (!targetMembership)
      throw Errors.notFound('User is not a member of this channel');

    if (targetMembership.role === 'OWNER') {
      throw Errors.forbidden('Cannot kick the channel owner');
    }

    return CommunityChatRepository.removeMember(targetUserId, channelId);
  },
};
