import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  toNextJsHandler: vi.fn(() => ({
    GET: vi.fn(),
    POST: vi.fn(),
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
    expect(mocks.toNextJsHandler).toHaveBeenCalled();
  });
});
