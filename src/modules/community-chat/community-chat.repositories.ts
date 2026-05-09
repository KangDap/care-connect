import { ChannelRole } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

import {
  Channel,
  ChannelMember,
  ChatMessage,
  CreateChannelDTO,
  SendMessageDTO,
} from './community-chat.types';

export const CommunityChatRepository = {
  async getAllChannels(): Promise<Channel[]> {
    const channels = await prisma.channel.findMany({
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
    return channels as unknown as Channel[];
  },

  async getChannelById(id: number): Promise<Channel | null> {
    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
    return channel as unknown as Channel;
  },

  async getChannelMembers(channelId: number): Promise<ChannelMember[]> {
    const members = await prisma.channelMember.findMany({
      where: { channelId },
    });
    return members as unknown as ChannelMember[];
  },

  async getChannelMessages(channelId: number): Promise<ChatMessage[]> {
    const messages = await prisma.chat.findMany({
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
    return messages as unknown as ChatMessage[];
  },

  async createChannel(data: CreateChannelDTO): Promise<Channel> {
    const channel = await prisma.channel.create({
      data: {
        name: data.name,
        description: data.description,
        coverUrl: data.coverUrl,
        type: data.type || 'PUBLIC',
      },
    });
    return channel as unknown as Channel;
  },

  async addMember(
    userId: string,
    channelId: number,
    role: ChannelRole = 'MEMBER',
  ): Promise<ChannelMember> {
    const member = await prisma.channelMember.upsert({
      where: {
        channelId_userId: { channelId, userId },
      },
      update: {
        role,
        lastViewedAt: new Date(),
      },
      create: {
        userId,
        channelId,
        role,
        lastViewedAt: new Date(),
      },
    });
    return member as unknown as ChannelMember;
  },

  async removeMember(userId: string, channelId: number): Promise<void> {
    await prisma.channelMember.delete({
      where: {
        channelId_userId: { channelId, userId },
      },
    });
  },

  async checkMembership(
    userId: string,
    channelId: number,
  ): Promise<ChannelMember | null> {
    const membership = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: { channelId, userId },
      },
    });
    return membership as unknown as ChannelMember;
  },

  async sendMessage(
    userId: string,
    data: SendMessageDTO & { isSystem?: boolean },
  ): Promise<ChatMessage> {
    const chat = await prisma.chat.create({
      data: {
        userId,
        channelId: data.channelId,
        content: data.content,
        mediaUrl: data.mediaUrl,
        isAnonymous: data.isAnonymous || false,
        isSystem: data.isSystem || false,
        replyToId: data.replyToId,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
    });
    return chat as unknown as ChatMessage;
  },

  async updateMemberRole(
    userId: string,
    channelId: number,
    role: ChannelRole,
  ): Promise<ChannelMember> {
    const member = await prisma.channelMember.update({
      where: {
        channelId_userId: { channelId, userId },
      },
      data: { role },
    });
    return member as unknown as ChannelMember;
  },

  async updateLastViewed(userId: string, channelId: number): Promise<void> {
    await prisma.channelMember.update({
      where: {
        channelId_userId: { channelId, userId },
      },
      data: { lastViewedAt: new Date() },
    });
  },

  async getJoinedChannels(userId: string): Promise<Channel[]> {
    const channels = await prisma.channel.findMany({
      where: {
        members: {
          some: {
            userId,
            role: { not: 'BANNED' },
          },
        },
      },
      include: {
        chats: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: { timestamp: true, content: true },
        },
        members: {
          where: { userId },
          select: {
            role: true,
            lastViewedAt: true,
          },
        },
        _count: {
          select: {
            members: {
              where: { role: { not: 'BANNED' } },
            },
            chats: true,
          },
        },
      },
    });
    return channels as unknown as Channel[];
  },

  async getUnreadCount(channelId: number, lastViewedAt: Date): Promise<number> {
    return prisma.chat.count({
      where: {
        channelId,
        timestamp: { gt: lastViewedAt },
      },
    });
  },

  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true, role: true },
    });
  },
};
