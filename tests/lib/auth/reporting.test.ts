// @vitest-environment node
import { reportAuthError, runAuthRequest } from '@/lib/auth/reporting';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ report: vi.fn(() => 'auth-event') }));
vi.mock('@/lib/server-error', () => ({ reportServerError: mocks.report }));

describe('auth exception reporting', () => {
  const request = () =>
    new Request('https://example.test/api/auth/sign-in/social', {
      method: 'POST',
    });
  beforeEach(() => vi.clearAllMocks());

  it('captures loader/handler exceptions without returning their messages', async () => {
    const response = await runAuthRequest(request(), async () => {
      throw new Error('private');
    });
    expect(response.status).toBe(500);
    expect(response.headers.get('X-Error-Reference')).toBe('auth-event');
    expect(await response.text()).not.toContain('private');
    expect(mocks.report).toHaveBeenCalledTimes(1);
  });

  it('reports an internally handled error once and reuses its reference for the 500 response', async () => {
    const response = await runAuthRequest(request(), async () => {
      reportAuthError(Object.assign(new Error('private'), { code: 'P2021' }));
      return new Response(null, { status: 500 });
    });
    expect(response.status).toBe(500);
    expect((await response.json()).reference).toBe('auth-event');
    expect(mocks.report).toHaveBeenCalledTimes(1);
  });

  it('preserves normal validation and OAuth redirect responses', async () => {
    for (const status of [200, 302, 401, 422]) {
      const original = new Response(null, { status });
      expect(await runAuthRequest(request(), async () => original)).toBe(
        original,
      );
    }
    reportAuthError({ statusCode: 401, message: 'Invalid password' });
    expect(mocks.report).not.toHaveBeenCalled();
  });

  it('reports empty upstream 500s even without an exception', async () => {
    const response = await runAuthRequest(
      request(),
      async () => new Response(null, { status: 500 }),
    );
    expect(response.status).toBe(500);
    expect(mocks.report).toHaveBeenCalledTimes(1);
  });

  it('does not share reporting state between simultaneous requests', async () => {
    const responses = await Promise.all(
      [1, 2].map(() =>
        runAuthRequest(request(), async () => {
          await Promise.resolve();
          reportAuthError(new Error('failure'));
          return new Response(null, { status: 500 });
        }),
      ),
    );
    expect(responses.every((response) => response.status === 500)).toBe(true);
    expect(mocks.report).toHaveBeenCalledTimes(2);
  });
});
