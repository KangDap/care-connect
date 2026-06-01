import {
  createChannelSchema,
  joinChannelSchema,
  sendMessageSchema,
} from '@/modules/community-chat/community-chat.schema';
import { describe, expect, it } from 'vitest';

describe('Community Chat Schema - createChannelSchema', () => {
  it('accepts valid channel data and sets default type to PUBLIC', () => {
    const result = createChannelSchema.parse({
      name: 'Safe Space',
      description: 'Tempat aman untuk berbagi cerita.',
      coverUrl: '',
    });

    expect(result).toEqual({
      name: 'Safe Space',
      description: 'Tempat aman untuk berbagi cerita.',
      coverUrl: '',
      type: 'PUBLIC',
    });
  });

  it('accepts PRIVATE channel type and valid coverUrl', () => {
    const result = createChannelSchema.parse({
      name: 'Private Support',
      description: 'Private community channel',
      coverUrl: 'https://example.com/cover.png',
      type: 'PRIVATE',
    });

    expect(result.type).toBe('PRIVATE');
    expect(result.coverUrl).toBe('https://example.com/cover.png');
  });

  it('rejects channel name shorter than 3 characters', () => {
    expect(() =>
      createChannelSchema.parse({
        name: 'ab',
      }),
    ).toThrow();
  });

  it('rejects channel name longer than 100 characters', () => {
    expect(() =>
      createChannelSchema.parse({
        name: 'a'.repeat(101),
      }),
    ).toThrow();
  });

  it('rejects description longer than 500 characters', () => {
    expect(() =>
      createChannelSchema.parse({
        name: 'Safe Space',
        description: 'a'.repeat(501),
      }),
    ).toThrow();
  });

  it('rejects invalid coverUrl', () => {
    expect(() =>
      createChannelSchema.parse({
        name: 'Safe Space',
        coverUrl: 'not-a-url',
      }),
    ).toThrow();
  });

  it('rejects unsupported channel type', () => {
    expect(() =>
      createChannelSchema.parse({
        name: 'Safe Space',
        type: 'SECRET',
      }),
    ).toThrow();
  });
});

describe('Community Chat Schema - sendMessageSchema', () => {
  it('accepts valid message data and sets default isAnonymous to false', () => {
    const result = sendMessageSchema.parse({
      channelId: 1,
      content: 'Halo semua.',
      mediaUrl: null,
      replyToId: null,
    });

    expect(result).toEqual({
      channelId: 1,
      content: 'Halo semua.',
      mediaUrl: null,
      isAnonymous: false,
      replyToId: null,
    });
  });

  it('accepts anonymous reply message with mediaUrl', () => {
    const result = sendMessageSchema.parse({
      channelId: 1,
      content: 'Ini reply anonim.',
      mediaUrl: 'https://example.com/media.png',
      isAnonymous: true,
      replyToId: 10,
    });

    expect(result).toEqual({
      channelId: 1,
      content: 'Ini reply anonim.',
      mediaUrl: 'https://example.com/media.png',
      isAnonymous: true,
      replyToId: 10,
    });
  });

  it('accepts empty content because schema allows min 0', () => {
    const result = sendMessageSchema.parse({
      channelId: 1,
      content: '',
    });

    expect(result.content).toBe('');
  });

  it('rejects content longer than 5000 characters', () => {
    expect(() =>
      sendMessageSchema.parse({
        channelId: 1,
        content: 'a'.repeat(5001),
      }),
    ).toThrow();
  });

  it('rejects invalid mediaUrl', () => {
    expect(() =>
      sendMessageSchema.parse({
        channelId: 1,
        content: 'Halo.',
        mediaUrl: 'invalid-url',
      }),
    ).toThrow();
  });

  it('rejects missing channelId', () => {
    expect(() =>
      sendMessageSchema.parse({
        content: 'Halo.',
      }),
    ).toThrow();
  });

  it('rejects string channelId because schema expects number', () => {
    expect(() =>
      sendMessageSchema.parse({
        channelId: '1',
        content: 'Halo.',
      }),
    ).toThrow();
  });
});

describe('Community Chat Schema - joinChannelSchema', () => {
  it('accepts valid channelId', () => {
    const result = joinChannelSchema.parse({
      channelId: 1,
    });

    expect(result).toEqual({
      channelId: 1,
    });
  });

  it('rejects missing channelId', () => {
    expect(() => joinChannelSchema.parse({})).toThrow();
  });

  it('rejects string channelId because schema expects number', () => {
    expect(() =>
      joinChannelSchema.parse({
        channelId: '1',
      }),
    ).toThrow();
  });
});
