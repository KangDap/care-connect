import { z } from 'zod';

export const createChannelSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  coverUrl: z.string().url().optional().or(z.literal('')),
  type: z.enum(['PUBLIC', 'PRIVATE']).optional().default('PUBLIC'),
});

export const sendMessageSchema = z.object({
  channelId: z.number(),
  content: z.string().min(1).max(5000),
  mediaUrl: z.string().url().optional().nullable(),
  isAnonymous: z.boolean().optional().default(false),
  replyToId: z.number().optional().nullable(),
});

export const joinChannelSchema = z.object({
  channelId: z.number(),
});
