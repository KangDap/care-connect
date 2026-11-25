import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  toNextJsHandler: vi.fn(() => ({
    GET: vi.fn(async () => Response.json(null)),
    POST: vi.fn(async () =>
      Response.json({ url: 'https://provider.example.test' }),
    ),
  })),
}));

vi.mock('better-auth/next-js', () => ({
  toNextJsHandler: mocks.toNextJsHandler,
}));

vi.mock('@/lib/auth/auth', () => ({
  auth: {
    handler: vi.fn(),
  },
}));

describe('API Route /api/auth/[...all]', () => {
  it('exports GET and POST handlers from Better Auth Next.js handler', async () => {
    const route = await import('@/app/api/auth/[...all]/route');

    expect(route.GET).toBeDefined();
    expect(route.POST).toBeDefined();
    expect(
      (
        await route.GET(
          new Request('https://example.test/api/auth/get-session'),
        )
      ).status,
    ).toBe(200);
    expect(mocks.toNextJsHandler).toHaveBeenCalled();
  });
});
