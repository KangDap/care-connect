import { exchangePausToken } from '@/lib/auth/paus-token';
import * as Sentry from '@sentry/nextjs';
import { validateAuthorizationCode } from 'better-auth/oauth2';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));
vi.mock('better-auth/oauth2', () => ({ validateAuthorizationCode: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('PAuS token diagnostics', () => {
  it('reports protocol failure without leaking credentials, code, or provider text', async () => {
    vi.stubEnv('PAUS_CLIENT_SECRET', 'private-client-secret');
    const error = {
      status: 401,
      error: 'invalid_client',
      message: 'private-response-body',
      access_token: 'private-access-token',
    };
    vi.mocked(validateAuthorizationCode).mockRejectedValueOnce(error);
    await expect(
      exchangePausToken({
        code: 'private-code',
        redirectURI: 'https://example.test/callback',
      }),
    ).rejects.toBe(error);
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
    const tokens = { accessToken: 'private-access-token', tokenType: 'bearer' };
    vi.mocked(validateAuthorizationCode).mockResolvedValueOnce(tokens);
    expect(
      await exchangePausToken({
        code: 'private-code',
        redirectURI: 'https://example.test/callback',
      }),
    ).toBe(tokens);
    expect(
      JSON.stringify(vi.mocked(Sentry.captureMessage).mock.calls),
    ).not.toContain('private-access-token');
  });
});
