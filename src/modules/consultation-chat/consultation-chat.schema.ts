import { Errors } from '@/lib/error';
import { z } from 'zod';

import type {
  ConsultationChatQueryInput,
  SendConsultationMessageInput,
} from './consultation-chat.types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const sendConsultationMessageSchema = z
  .object({
    consultationId: z.coerce.number().int().positive('Invalid consultation ID'),
    content: z.string().optional().default(''),
    isAnonymous: z.coerce.boolean().optional().default(false),
    replyToId: z.coerce.number().int().optional().nullable(),
    media: z
      .any()
      .transform((val) => (val instanceof File && val.size > 0 ? val : null))
      .refine(
        (file) =>
          file === null ||
          (file.size <= MAX_FILE_SIZE &&
            ALLOWED_FILE_TYPES.includes(file.type)),
        'Invalid file. Only JPG, PNG, and PDF under 10MB are allowed.',
      )
      .optional(),
  })
  .refine((data) => data.content.trim().length > 0 || data.media !== null, {
    message: 'Message content or a file is required',
    path: ['content'],
  });

export const consultationChatQuerySchema = z.object({
  consultationId: z.coerce.number().int().positive('Invalid consultation ID'),
});

export class ConsultationChatSchema {
  static validateSendMessageInput(data: unknown): SendConsultationMessageInput {
    const parseResult = sendConsultationMessageSchema.safeParse(data);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((issue) => issue.message)
        .join(', ');
      throw Errors.badRequest(`Invalid message data: ${errorMessage}`);
    }

    return parseResult.data;
  }

  static validateQueryInput(data: unknown): ConsultationChatQueryInput {
    const parseResult = consultationChatQuerySchema.safeParse(data);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((issue) => issue.message)
        .join(', ');
      throw Errors.badRequest(`Invalid query parameters: ${errorMessage}`);
    }

    return parseResult.data;
  }
}
