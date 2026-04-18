import { Errors } from '@/lib/error';
import { getSupabaseClient } from '@/lib/supabase';

import {
  createConsultationChat,
  findConsultationParticipant,
  getConsultationChatsByConsultationId,
} from './consultation-chat.repositories';
import { ConsultationChatSchema } from './consultation-chat.schema';
import type { SendConsultationMessageInput } from './consultation-chat.types';

/**
 * Sends a message in the consultation chat.
 */
export const sendConsultationMessage = async (
  userId: string,
  input: SendConsultationMessageInput,
) => {
  // 0. Validate input using Zod
  const validatedInput = ConsultationChatSchema.validateSendMessageInput(input);
  const { consultationId, content, isAnonymous, media, replyToId } =
    validatedInput;

  // 1. Validate consultation access
  const consultation = await findConsultationParticipant(
    consultationId,
    userId,
  );

  if (!consultation) {
    throw Errors.forbidden('You do not have access to this consultation.');
  }

  // 1.5 Check expiry (7 hours after start: 1h duration + 6h buffer)
  const startDateTime = new Date(consultation.date);
  const timeDate = new Date(consultation.time);
  startDateTime.setUTCHours(
    timeDate.getUTCHours(),
    timeDate.getUTCMinutes(),
    0,
    0,
  );
  const expiryTime = new Date(startDateTime.getTime() + 7 * 60 * 60 * 1000);

  if (new Date() > expiryTime) {
    throw Errors.forbidden(
      'Sesi konsultasi telah berakhir. Ruangan chat ditutup.',
    );
  }

  // 2. Upload media if present
  let mediaUrl: string | null = null;
  const supabase = getSupabaseClient();

  if (media && supabase) {
    const fileExt = media.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const fileData = await media.arrayBuffer();

    const { error } = await supabase.storage
      .from('consultations-chat-files')
      .upload(fileName, fileData, {
        contentType: media.type,
      });

    if (error) {
      console.error('Chat file upload error:', error);
      throw Errors.storage('Failed to upload file');
    }

    const { data: publicUrl } = supabase.storage
      .from('consultations-chat-files')
      .getPublicUrl(fileName);

    mediaUrl = publicUrl.publicUrl;
  }

  // 3. Create the message directly linked to the consultation
  const chat = await createConsultationChat(
    consultationId,
    userId,
    content,
    isAnonymous ?? false,
    mediaUrl,
    replyToId ?? null,
  );

  return chat;
};

/**
 * Retrieves the message history for a consultation.
 */
export const getConsultationMessages = async (
  consultationId: number,
  userId: string,
) => {
  // 1. Validate consultation access
  const consultation = await findConsultationParticipant(
    consultationId,
    userId,
  );

  if (!consultation) {
    throw Errors.forbidden('You do not have access to this consultation.');
  }

  // 2. Return chats linked to this consultation + expiry status
  const startDateTime = new Date(consultation.date);
  const timeDate = new Date(consultation.time);
  startDateTime.setUTCHours(
    timeDate.getUTCHours(),
    timeDate.getUTCMinutes(),
    0,
    0,
  );
  const expiryTime = new Date(startDateTime.getTime() + 7 * 60 * 60 * 1000);
  const isExpired = new Date() > expiryTime;

  const messages = await getConsultationChatsByConsultationId(consultationId);

  return {
    messages,
    isExpired,
  };
};
