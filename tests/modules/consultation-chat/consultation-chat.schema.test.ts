import { ApiError } from '@/lib/error';
import { ConsultationChatSchema } from '@/modules/consultation-chat/consultation-chat.schema';
import { describe, expect, it } from 'vitest';

const isSendButtonDisabled = ({
  isPending = false,
  messageInput = '',
  mediaFile = null,
}: {
  isPending?: boolean;
  messageInput?: string;
  mediaFile?: File | null;
}) => {
  return isPending || (!messageInput.trim() && !mediaFile);
};

describe('ConsultationChatSchema.validateSendMessageInput', () => {
  it('validates text message input and coerces consultationId', () => {
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

  it('accepts text-only message', () => {
    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: 'Halo dok, saya ingin konsultasi.',
    });

    expect(result.consultationId).toBe(1);
    expect(result.content).toBe('Halo dok, saya ingin konsultasi.');
    expect(result.isAnonymous).toBe(false);
    expect(result.media).toBeUndefined();
  });

  it('accepts file-only message', () => {
    const media = new File(['pdf'], 'dokumen.pdf', {
      type: 'application/pdf',
    });

    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: '',
      media,
    });

    expect(result.consultationId).toBe(1);
    expect(result.content).toBe('');
    expect(result.isAnonymous).toBe(false);
    expect(result.media).toBe(media);
  });

  it('accepts message with text and valid file attachment', () => {
    const media = new File(['image'], 'bukti.png', {
      type: 'image/png',
    });

    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: 'Ini saya lampirkan dokumennya.',
      media,
      isAnonymous: 'true',
    });

    expect(result.consultationId).toBe(1);
    expect(result.content).toBe('Ini saya lampirkan dokumennya.');
    expect(result.media).toBe(media);
    expect(result.isAnonymous).toBe(true);
  });

  it('defaults content to empty string and isAnonymous to false when only file is submitted', () => {
    const media = new File(['image'], 'bukti.png', {
      type: 'image/png',
    });

    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      media,
    });

    expect(result.content).toBe('');
    expect(result.isAnonymous).toBe(false);
    expect(result.media).toBe(media);
  });

  it('accepts empty content without media based on current backend schema behavior', () => {
    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: '',
    });

    expect(result.consultationId).toBe(1);
    expect(result.content).toBe('');
    expect(result.media).toBeUndefined();
  });

  it('accepts blank-space-only content without media based on current backend schema behavior', () => {
    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: '   ',
    });

    expect(result.consultationId).toBe(1);
    expect(result.content).toBe('   ');
    expect(result.media).toBeUndefined();
  });

  it('accepts blank-space content if valid file exists', () => {
    const media = new File(['pdf'], 'dokumen.pdf', {
      type: 'application/pdf',
    });

    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: '   ',
      media,
    });

    expect(result.consultationId).toBe(1);
    expect(result.content).toBe('   ');
    expect(result.media).toBe(media);
  });

  it('rejects empty file without content', () => {
    const media = new File([], 'kosong.pdf', {
      type: 'application/pdf',
    });

    expect(() =>
      ConsultationChatSchema.validateSendMessageInput({
        consultationId: 1,
        content: '',
        media,
      }),
    ).toThrow(/Message content or a file is required/);
  });

  it.each([0, -1, 'abc'])(
    'rejects invalid consultationId %s',
    (consultationId) => {
      expect(() =>
        ConsultationChatSchema.validateSendMessageInput({
          consultationId,
          content: 'Halo',
        }),
      ).toThrow(ApiError);
    },
  );

  it('rejects unsupported media type', () => {
    const media = new File(['x'], 'virus.exe', {
      type: 'application/x-msdownload',
    });

    expect(() =>
      ConsultationChatSchema.validateSendMessageInput({
        consultationId: 1,
        content: '',
        media,
      }),
    ).toThrow(/Only JPG, PNG, and PDF/);
  });

  it('rejects media larger than 10MB', () => {
    const media = new File(
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
        media,
      }),
    ).toThrow(/under 10MB/);
  });

  it('allows null replyToId', () => {
    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: 'Pesan baru',
      replyToId: null,
    });

    expect(result.replyToId).toBeNull();
  });

  it('coerces replyToId from string to number', () => {
    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: 'Ini balasan pesan.',
      replyToId: '5',
    });

    expect(result.replyToId).toBe(5);
  });

  it('rejects invalid replyToId', () => {
    expect(() =>
      ConsultationChatSchema.validateSendMessageInput({
        consultationId: 1,
        content: 'Ini balasan pesan.',
        replyToId: 'abc',
      }),
    ).toThrow(ApiError);
  });

  it('coerces isAnonymous true from string', () => {
    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: 'Pesan anonim.',
      isAnonymous: 'true',
    });

    expect(result.isAnonymous).toBe(true);
  });

  it('coerces isAnonymous false string to true based on z.coerce.boolean behavior', () => {
    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: 'Pesan tidak anonim.',
      isAnonymous: 'false',
    });

    expect(result.isAnonymous).toBe(true);
  });

  it('keeps isAnonymous boolean false as false', () => {
    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: 'Pesan tidak anonim.',
      isAnonymous: false,
    });

    expect(result.isAnonymous).toBe(false);
  });

  it('keeps isAnonymous boolean true as true', () => {
    const result = ConsultationChatSchema.validateSendMessageInput({
      consultationId: 1,
      content: 'Pesan anonim.',
      isAnonymous: true,
    });

    expect(result.isAnonymous).toBe(true);
  });
});

describe('ConsultationChat frontend send button behavior', () => {
  it('disables send button when message is empty and no file is selected', () => {
    expect(
      isSendButtonDisabled({
        messageInput: '',
        mediaFile: null,
      }),
    ).toBe(true);
  });

  it('disables send button when message only contains spaces and no file is selected', () => {
    expect(
      isSendButtonDisabled({
        messageInput: '   ',
        mediaFile: null,
      }),
    ).toBe(true);
  });

  it('enables send button when message contains text and no file is selected', () => {
    expect(
      isSendButtonDisabled({
        messageInput: 'Halo dok',
        mediaFile: null,
      }),
    ).toBe(false);
  });

  it('enables send button when message is empty but file is selected', () => {
    const file = new File(['pdf'], 'dokumen.pdf', {
      type: 'application/pdf',
    });

    expect(
      isSendButtonDisabled({
        messageInput: '',
        mediaFile: file,
      }),
    ).toBe(false);
  });

  it('enables send button when message only contains spaces but file is selected', () => {
    const file = new File(['pdf'], 'dokumen.pdf', {
      type: 'application/pdf',
    });

    expect(
      isSendButtonDisabled({
        messageInput: '   ',
        mediaFile: file,
      }),
    ).toBe(false);
  });

  it('disables send button while message mutation is pending', () => {
    expect(
      isSendButtonDisabled({
        isPending: true,
        messageInput: 'Halo dok',
        mediaFile: null,
      }),
    ).toBe(true);
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

  it.each([0, -4, 'abc', undefined])(
    'rejects invalid query consultationId %s',
    (consultationId) => {
      expect(() =>
        ConsultationChatSchema.validateQueryInput({
          consultationId,
        }),
      ).toThrow(/Invalid query parameters/);
    },
  );
});
