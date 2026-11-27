import { exchangePausToken } from '@/lib/auth/paus-token';
import * as Sentry from '@sentry/nextjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('PAuS token diagnostics', () => {
  it('reports protocol failure without leaking credentials, code, or provider text', async () => {
    vi.stubEnv('PAUS_CLIENT_SECRET', 'private-client-secret');
    vi.stubEnv('PAUS_CLIENT_ID', 'test-client');
    const error = {
      status: 401,
      error: 'invalid_client',
      message: 'private-response-body',
      access_token: 'private-access-token',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(Response.json(error, { status: 401 })),
    );
    await expect(
      exchangePausToken({
        code: 'private-code',
        redirectURI: 'https://example.test/callback',
      }),
    ).rejects.toThrow('PAuS token response was rejected');
    const args = vi.mocked(Sentry.captureException).mock.calls[0];
    expect(args[1]?.extra).toMatchObject({
      http_status: 401,
      provider_error: 'invalid_client',
      authentication: 'client_secret_post',
    });
    const serialized = JSON.stringify(args);
    for (const secret of [
      'private-client-secret',
      'private-response-body',
      'private-access-token',
      'private-code',
    ])
      expect(serialized).not.toContain(secret);
  });

  it('preserves successful tokens and never includes them in the success event', async () => {
    vi.stubEnv('PAUS_CLIENT_ID', 'test-client');
    vi.stubEnv('PAUS_CLIENT_SECRET', 'private-client-secret');
    vi.stubEnv('PAUS_TOKEN_URL', 'https://paus.unpad.ac.id/oauth/access-token');
    vi.stubEnv('PAUS_REDIRECT_URI', 'https://example.test/callback');
    const fetchMock = vi.fn().mockResolvedValueOnce(
      Response.json({
        access_token: 'private-access-token',
        expires_in: 3600,
        refresh_token: 'private-refresh-token',
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(
      await exchangePausToken({
        code: 'private-code',
        redirectURI: 'https://example.test/callback',
      }),
    ).toMatchObject({
      accessToken: 'private-access-token',
      tokenType: 'bearer',
      refreshToken: 'private-refresh-token',
      accessTokenExpiresAt: expect.any(Date),
    });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://paus.unpad.ac.id/oauth/access-token');
    expect(Object.fromEntries(options.body)).toEqual({
      client_id: 'test-client',
      client_secret: 'private-client-secret',
      grant_type: 'authorization_code',
      redirect_uri: 'https://example.test/callback',
      code: 'private-code',
    });
    expect(options.redirect).toBe('manual');
    expect(
      JSON.stringify(vi.mocked(Sentry.captureMessage).mock.calls),
    ).not.toContain('private-access-token');
  });

  it('rejects a successful HTTP response without an access token', async () => {
    vi.stubEnv('PAUS_CLIENT_ID', 'test-client');
    vi.stubEnv('PAUS_CLIENT_SECRET', 'private-client-secret');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(Response.json({ expires_in: 3600 })),
    );
    await expect(
      exchangePausToken({
        code: 'private-code',
        redirectURI: 'https://example.test/callback',
      }),
    ).rejects.toThrow('PAuS token response was rejected');
  });
});
