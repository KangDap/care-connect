import { getPausUserInfo } from '@/lib/auth/paus';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('PAuS profile validation', () => {
  it('uses a stable provider ID and only explicit verification claims', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        id: 42,
        email: 'person@example.test',
        nama: 'Person',
        email_verified: true,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('PAUS_USER_INFO_URL', 'https://provider.example.test/user');
    expect(await getPausUserInfo('test-token')).toEqual({
      id: '42',
      email: 'person@example.test',
      name: 'Person',
      emailVerified: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://provider.example.test/user',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
        cache: 'no-store',
      }),
    );
  });

  it('does not assume an email is verified', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          sub: 'stable-subject',
          email: 'person@example.test',
        }),
      ),
    );
    expect(await getPausUserInfo('test-token')).toMatchObject({
      id: 'stable-subject',
      emailVerified: false,
    });
  });

  it.each([
    { username: 'person', email: 'person@example.test' },
    { id: '42', email: '' },
    { id: '42', email: 'invalid-email' },
    {},
    null,
  ])(
    'rejects incomplete identity without inventing a shared ID: %j',
    async (profile) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(profile)));
      expect(await getPausUserInfo('test-token')).toBeNull();
    },
  );

  it('rejects provider errors even if their body resembles a valid profile', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { id: '42', email: 'person@example.test' },
            { status: 401 },
          ),
        ),
    );
    expect(await getPausUserInfo('test-token')).toBeNull();
  });

  it('rejects invalid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>Login</html>')),
    );
    expect(await getPausUserInfo('test-token')).toBeNull();
  });
});
