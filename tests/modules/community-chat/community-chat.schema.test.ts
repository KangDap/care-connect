import {
  createChannelSchema,
  joinChannelSchema,
  sendMessageSchema,
} from '@/modules/community-chat/community-chat.schema';
import { describe, expect, it } from 'vitest';

describe('community-chat.schema createChannelSchema', () => {
  it('validates complete public channel payload', () => {
    const result = createChannelSchema.parse({
      name: 'Physical Abuse Support',
      description: 'Ruang dukungan untuk penyintas kekerasan fisik.',
      coverUrl: 'https://example.com/cover.png',
      type: 'PUBLIC',
    });

    expect(result).toMatchObject({
      name: 'Physical Abuse Support',
      type: 'PUBLIC',
    });
  });

  it('defaults channel type to PUBLIC', () => {
    const result = createChannelSchema.parse({ name: 'Verbal Abuse Support' });

    expect(result.type).toBe('PUBLIC');
  });

  it('allows empty coverUrl string', () => {
    const result = createChannelSchema.parse({
      name: 'Safe Space',
      coverUrl: '',
    });

    expect(result.coverUrl).toBe('');
  });

  it('rejects name shorter than 3 characters', () => {
    expect(() => createChannelSchema.parse({ name: 'AB' })).toThrow();
  });

  it('rejects description longer than 500 characters', () => {
    expect(() =>
      createChannelSchema.parse({
        name: 'Safe Space',
        description: 'x'.repeat(501),
      }),
    ).toThrow();
  });

  it('rejects invalid coverUrl', () => {
    expect(() =>
      createChannelSchema.parse({ name: 'Safe Space', coverUrl: 'not-url' }),
    ).toThrow();
  });

  it('rejects invalid channel type', () => {
    expect(() =>
      createChannelSchema.parse({ name: 'Safe Space', type: 'SECRET' }),
    ).toThrow();
  });
});

describe('community-chat.schema sendMessageSchema', () => {
  it('validates normal chat message payload', () => {
    const result = sendMessageSchema.parse({
      channelId: 1,
      content: 'Terima kasih sudah berbagi.',
      mediaUrl: 'https://example.com/file.png',
      isAnonymous: true,
      replyToId: 2,
    });

    expect(result).toMatchObject({
      channelId: 1,
      content: 'Terima kasih sudah berbagi.',
      isAnonymous: true,
      replyToId: 2,
    });
  });

  it('defaults isAnonymous to false', () => {
    const result = sendMessageSchema.parse({ channelId: 1, content: 'Halo' });

    expect(result.isAnonymous).toBe(false);
  });

  it('allows empty content so media-only message can be handled by service/UI', () => {
    const result = sendMessageSchema.parse({ channelId: 1, content: '' });

    expect(result.content).toBe('');
  });

  it('rejects content longer than 5000 characters', () => {
    expect(() =>
      sendMessageSchema.parse({ channelId: 1, content: 'x'.repeat(5001) }),
    ).toThrow();
  });

  it('rejects invalid mediaUrl', () => {
    expect(() =>
      sendMessageSchema.parse({
        channelId: 1,
        content: 'Halo',
        mediaUrl: 'file-local',
      }),
    ).toThrow();
  });
});

describe('community-chat.schema joinChannelSchema', () => {
  it('validates channelId payload', () => {
    expect(joinChannelSchema.parse({ channelId: 10 })).toEqual({
      channelId: 10,
    });
  });

  it('rejects string channelId because route should convert it explicitly', () => {
    expect(() => joinChannelSchema.parse({ channelId: '10' })).toThrow();
  });
});
