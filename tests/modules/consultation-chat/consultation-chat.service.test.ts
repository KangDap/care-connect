import {
  getConsultationMessages,
  sendConsultationMessage,
} from '@/modules/consultation-chat/consultation-chat.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findConsultationParticipant: vi.fn(),
  createConsultationChat: vi.fn(),
  getConsultationChatsByConsultationId: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

vi.mock('@/modules/consultation-chat/consultation-chat.repositories', () => ({
  findConsultationParticipant: mocks.findConsultationParticipant,
  createConsultationChat: mocks.createConsultationChat,
  getConsultationChatsByConsultationId:
    mocks.getConsultationChatsByConsultationId,
}));

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
}));

const futureConsultation = () => ({
  id: 1,
  userId: 'user-1',
  psychologistId: 'psy-1',
  date: new Date('2099-01-01T00:00:00.000Z'),
  time: new Date('1970-01-01T09:00:00.000Z'),
});

const expiredConsultation = () => ({
  id: 1,
  userId: 'user-1',
  psychologistId: 'psy-1',
  date: new Date('2026-05-01T00:00:00.000Z'),
  time: new Date('1970-01-01T09:00:00.000Z'),
});

describe('consultation-chat.service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));

    mocks.findConsultationParticipant.mockReset();
    mocks.createConsultationChat.mockReset();
    mocks.getConsultationChatsByConsultationId.mockReset();
    mocks.getSupabaseClient.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends text message when user has access to consultation', async () => {
    mocks.findConsultationParticipant.mockResolvedValue(futureConsultation());
    mocks.createConsultationChat.mockResolvedValue({
      id: 99,
      content: 'Halo',
    });
    mocks.getSupabaseClient.mockReturnValue(null);

    const result = await sendConsultationMessage('user-1', {
      consultationId: 1,
      content: 'Halo',
      isAnonymous: true,
      replyToId: 5,
    });

    expect(result).toEqual({
      id: 99,
      content: 'Halo',
    });

    expect(mocks.findConsultationParticipant).toHaveBeenCalledWith(1, 'user-1');

    expect(mocks.createConsultationChat).toHaveBeenCalledWith(
      1,
      'user-1',
      'Halo',
      true,
      null,
      5,
    );
  });

  it('sends non-anonymous text message by default', async () => {
    mocks.findConsultationParticipant.mockResolvedValue(futureConsultation());
    mocks.createConsultationChat.mockResolvedValue({
      id: 100,
      content: 'Pesan biasa',
      isAnonymous: false,
    });
    mocks.getSupabaseClient.mockReturnValue(null);

    const result = await sendConsultationMessage('user-1', {
      consultationId: 1,
      content: 'Pesan biasa',
    });

    expect(result).toEqual({
      id: 100,
      content: 'Pesan biasa',
      isAnonymous: false,
    });

    expect(mocks.createConsultationChat).toHaveBeenCalledWith(
      1,
      'user-1',
      'Pesan biasa',
      false,
      null,
      null,
    );
  });

  it('rejects sending message when user is not a consultation participant', async () => {
    mocks.findConsultationParticipant.mockResolvedValue(null);

    await expect(
      sendConsultationMessage('outsider', {
        consultationId: 1,
        content: 'Halo',
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });

    expect(mocks.createConsultationChat).not.toHaveBeenCalled();
  });

  it('rejects sending message after consultation chat room is expired', async () => {
    mocks.findConsultationParticipant.mockResolvedValue(expiredConsultation());

    await expect(
      sendConsultationMessage('user-1', {
        consultationId: 1,
        content: 'Halo',
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });

    expect(mocks.createConsultationChat).not.toHaveBeenCalled();
  });

  it('uploads media and stores public URL when file exists', async () => {
    const media = new File(['image'], 'chat.png', {
      type: 'image/png',
    });

    const upload = vi.fn().mockResolvedValue({
      error: null,
    });

    const getPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl: 'https://cdn.test/chat.png',
      },
    });

    const from = vi.fn().mockReturnValue({
      upload,
      getPublicUrl,
    });

    mocks.findConsultationParticipant.mockResolvedValue(futureConsultation());
    mocks.getSupabaseClient.mockReturnValue({
      storage: {
        from,
      },
    });

    mocks.createConsultationChat.mockResolvedValue({
      id: 1,
      content: '',
      mediaUrl: 'https://cdn.test/chat.png',
    });

    const result = await sendConsultationMessage('user-1', {
      consultationId: 1,
      content: '',
      media,
    });

    expect(result).toEqual({
      id: 1,
      content: '',
      mediaUrl: 'https://cdn.test/chat.png',
    });

    expect(from).toHaveBeenCalledWith('consultations-chat-files');
    expect(upload).toHaveBeenCalled();
    expect(getPublicUrl).toHaveBeenCalled();

    expect(mocks.createConsultationChat).toHaveBeenCalledWith(
      1,
      'user-1',
      '',
      false,
      'https://cdn.test/chat.png',
      null,
    );
  });

  it('throws storage error when media upload fails', async () => {
    const media = new File(['image'], 'chat.png', {
      type: 'image/png',
    });

    const upload = vi.fn().mockResolvedValue({
      error: {
        message: 'bucket error',
      },
    });

    const getPublicUrl = vi.fn();

    mocks.findConsultationParticipant.mockResolvedValue(futureConsultation());
    mocks.getSupabaseClient.mockReturnValue({
      storage: {
        from: vi.fn().mockReturnValue({
          upload,
          getPublicUrl,
        }),
      },
    });

    await expect(
      sendConsultationMessage('user-1', {
        consultationId: 1,
        content: '',
        media,
      }),
    ).rejects.toMatchObject({
      status: 500,
      code: 'STORAGE_ERROR',
    });

    expect(mocks.createConsultationChat).not.toHaveBeenCalled();
  });

  it('sends message without media upload when Supabase client is null', async () => {
    const media = new File(['image'], 'chat.png', {
      type: 'image/png',
    });

    mocks.findConsultationParticipant.mockResolvedValue(futureConsultation());
    mocks.getSupabaseClient.mockReturnValue(null);
    mocks.createConsultationChat.mockResolvedValue({
      id: 2,
      content: '',
      mediaUrl: null,
    });

    const result = await sendConsultationMessage('user-1', {
      consultationId: 1,
      content: '',
      media,
    });

    expect(result).toEqual({
      id: 2,
      content: '',
      mediaUrl: null,
    });

    expect(mocks.createConsultationChat).toHaveBeenCalledWith(
      1,
      'user-1',
      '',
      false,
      null,
      null,
    );
  });

  it('returns consultation messages and isExpired false for active room', async () => {
    const messages = [
      {
        id: 1,
        content: 'Halo',
      },
      {
        id: 2,
        content: 'Halo juga',
      },
    ];

    mocks.findConsultationParticipant.mockResolvedValue(futureConsultation());
    mocks.getConsultationChatsByConsultationId.mockResolvedValue(messages);

    const result = await getConsultationMessages(1, 'user-1');

    expect(result).toEqual({
      messages,
      isExpired: false,
    });

    expect(mocks.findConsultationParticipant).toHaveBeenCalledWith(1, 'user-1');
    expect(mocks.getConsultationChatsByConsultationId).toHaveBeenCalledWith(1);
  });

  it('returns isExpired true for expired consultation room', async () => {
    mocks.findConsultationParticipant.mockResolvedValue(expiredConsultation());
    mocks.getConsultationChatsByConsultationId.mockResolvedValue([]);

    const result = await getConsultationMessages(1, 'user-1');

    expect(result).toEqual({
      messages: [],
      isExpired: true,
    });
  });

  it('rejects reading messages when user has no access', async () => {
    mocks.findConsultationParticipant.mockResolvedValue(null);

    await expect(getConsultationMessages(1, 'outsider')).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });

    expect(mocks.getConsultationChatsByConsultationId).not.toHaveBeenCalled();
  });

  it('still returns message history even if room is expired', async () => {
    const messages = [
      {
        id: 1,
        content: 'Riwayat lama',
      },
    ];

    mocks.findConsultationParticipant.mockResolvedValue(expiredConsultation());
    mocks.getConsultationChatsByConsultationId.mockResolvedValue(messages);

    const result = await getConsultationMessages(1, 'user-1');

    expect(result.messages).toEqual(messages);
    expect(result.isExpired).toBe(true);
  });
});
