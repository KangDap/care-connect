import { prisma } from '@/lib/prisma';

import { CreateChannelDTO, SendMessageDTO } from './community-chat.types';

export const CommunityChatRepository = {
  async getAllChannels() {
    return prisma.channel.findMany({
      include: {
        chats: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: { timestamp: true, content: true },
        },
        _count: {
          select: { members: true },
        },
      },
    });
  },

  async getChannelById(id: number) {
    return prisma.channel.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
  },

  async getChannelMessages(channelId: number) {
    return prisma.chat.findMany({
      where: { channelId },
      orderBy: { timestamp: 'asc' },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
        replyTo: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });
  },

  async createChannel(data: CreateChannelDTO) {
    return prisma.channel.create({
      data: {
        name: data.name,
        description: data.description,
        coverUrl: data.coverUrl,
        type: data.type || 'PUBLIC',
      },
    });
  },

  async addMember(
    userId: string,
    channelId: number,
    role: 'OWNER' | 'MODERATOR' | 'MEMBER' = 'MEMBER',
  ) {
    return prisma.channelMember.upsert({
      where: {
        channelId_userId: { channelId, userId },
      },
      update: { role },
      create: { userId, channelId, role },
    });
  },

  async removeMember(userId: string, channelId: number) {
    return prisma.channelMember.delete({
      where: {
        channelId_userId: { channelId, userId },
      },
    });
  },

  async checkMembership(userId: string, channelId: number) {
    return prisma.channelMember.findUnique({
      where: {
        channelId_userId: { channelId, userId },
      },
    });
  },

  async sendMessage(userId: string, data: SendMessageDTO) {
    return prisma.chat.create({
      data: {
        userId,
        channelId: data.channelId,
        content: data.content,
        mediaUrl: data.mediaUrl,
        isAnonymous: data.isAnonymous || false,
        replyToId: data.replyToId,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
    });
  },
  async updateMemberRole(
    userId: string,
    channelId: number,
    role: 'OWNER' | 'MODERATOR' | 'MEMBER',
  ) {
    return prisma.channelMember.update({
      where: {
        channelId_userId: { channelId, userId },
      },
      data: { role },
    });
  },
};
