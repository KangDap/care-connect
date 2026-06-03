import { ApiError } from '@/lib/error';
import { ConsultationChatSchema } from '@/modules/consultation-chat/consultation-chat.schema';
import { describe, expect, it } from 'vitest';

describe('ConsultationChatSchema.validateSendMessageInput', () => {
  it('accepts valid text message and coerces fields', () => {
    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: '12',
      content: 'Halo dok, saya ingin konsultasi.',
      isAnonymous: 'true',
      replyToId: '3',
    });

    expect(result).toMatchObject({
      consultationId: 12,
      content: 'Halo dok, saya ingin konsultasi.',
      isAnonymous: true,
      replyToId: 3,
    });
  });

  it('accepts file-only message with valid media', () => {
    const media = new File(['pdf'], 'dokumen.pdf', {
      type: 'application/pdf',
    });

    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: '',
      media,
    });

    expect(result).toMatchObject({
      consultationId: 1,
      content: '',
      isAnonymous: false,
      media,
    });
  });

  it('accepts empty content because frontend prevents empty submit', () => {
    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: '',
      media: undefined,
    });

    expect(result).toMatchObject({
      consultationId: 1,
      content: '',
      isAnonymous: false,
    });
  });

  it('rejects invalid consultationId', () => {
    expect(() =>
      ConsultationChatSchema.validateSendMessageInput({
        consultationId: 'abc',
        content: 'Halo',
      }),
    ).toThrow(ApiError);
  });

  it('rejects invalid media file', () => {
    const unsupportedMedia = new File(['x'], 'virus.exe', {
      type: 'application/x-msdownload',
    });

    expect(() =>
      ConsultationChatSchema.validateSendMessageInput({
        consultationId: 1,
        content: '',
        media: unsupportedMedia,
      }),
    ).toThrow(/Only JPG, PNG, and PDF/);

    const oversizedMedia = new File(
      [new Uint8Array(10 * 1024 * 1024 + 1)],
      'besar.png',
      {
        type: 'image/png',
      },
    );

    expect(() =>
      ConsultationChatSchema.validateSendMessageInput({
        consultationId: 1,
        content: '',
        media: oversizedMedia,
      }),
    ).toThrow(/under 10MB/);
  });

  it('accepts nullable replyToId and coerces string replyToId', () => {
    const nullReply = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: 'Pesan baru',
      replyToId: null,
    });

    expect(nullReply.replyToId).toBeNull();

    const stringReply = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: 'Ini balasan pesan.',
      replyToId: '5',
    });

    expect(stringReply.replyToId).toBe(5);
  });
});

describe('ConsultationChatSchema.validateQueryInput', () => {
  it('coerces consultationId query to number', () => {
    const result = ConsultationChatSchema.validateQueryInput({
      consultationId: '7',
    });

    expect(result).toEqual({
      consultationId: 7,
    });
  });

  it('rejects invalid query consultationId', () => {
    expect(() =>
      ConsultationChatSchema.validateQueryInput({
        consultationId: 'abc',
      }),
    ).toThrow(/Invalid query parameters/);
  });
});
