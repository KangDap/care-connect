import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  betterAuth: vi.fn((config) => ({
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
    config,
  })),

  prismaAdapter: vi.fn((prisma, options) => ({
    adapter: 'prisma-adapter',
    prisma,
    options,
  })),

  admin: vi.fn(() => 'admin-plugin'),
  openAPI: vi.fn(() => 'openapi-plugin'),
  username: vi.fn(() => 'username-plugin'),

  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('better-auth', () => ({
  betterAuth: mocks.betterAuth,
}));

vi.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: mocks.prismaAdapter,
}));

vi.mock('better-auth/plugins', () => ({
  admin: mocks.admin,
  openAPI: mocks.openAPI,
  username: mocks.username,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mocks.prisma,
}));

describe('Auth Server Configuration Unit Testing', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    process.env.GOOGLE_CLIENT_ID = 'google-client-id-test';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret-test';
  });

  it('TC-AUTH-01 berhasil membuat konfigurasi auth server', async () => {
    const { auth } = await import('@/lib/auth/auth');

    expect(auth).toBeDefined();
    expect(mocks.betterAuth).toHaveBeenCalledTimes(1);
  });

  it('TC-AUTH-02 menggunakan Prisma adapter sebagai database auth', async () => {
    await import('@/lib/auth/auth');

    expect(mocks.prismaAdapter).toHaveBeenCalledTimes(1);
    expect(mocks.prismaAdapter).toHaveBeenCalledWith(mocks.prisma, {
      provider: 'postgresql',
    });
  });

  it('TC-AUTH-03 mengaktifkan login menggunakan email dan password', async () => {
    await import('@/lib/auth/auth');

    const authConfig = mocks.betterAuth.mock.calls[0][0];

    expect(authConfig.emailAndPassword).toBeDefined();
    expect(authConfig.emailAndPassword.enabled).toBe(true);
  });

  it('TC-AUTH-04 mengaktifkan verifikasi email pada email login', async () => {
    await import('@/lib/auth/auth');

    const authConfig = mocks.betterAuth.mock.calls[0][0];

    expect(authConfig.emailAndPassword.requireEmailVerification).toBe(true);
  });

  it('TC-AUTH-05 auto sign in setelah register dinonaktifkan', async () => {
    await import('@/lib/auth/auth');

    const authConfig = mocks.betterAuth.mock.calls[0][0];

    expect(authConfig.emailAndPassword.autoSignIn).toBe(false);
  });

  it('TC-AUTH-06 mengaktifkan Google SSO provider', async () => {
    await import('@/lib/auth/auth');

    const authConfig = mocks.betterAuth.mock.calls[0][0];

    expect(authConfig.socialProviders).toBeDefined();
    expect(authConfig.socialProviders.google).toBeDefined();
  });

  it('TC-AUTH-07 Google SSO menggunakan clientId dari environment variable', async () => {
    await import('@/lib/auth/auth');

    const authConfig = mocks.betterAuth.mock.calls[0][0];

    expect(authConfig.socialProviders.google.clientId).toBe(
      'google-client-id-test',
    );
  });

  it('TC-AUTH-08 Google SSO menggunakan clientSecret dari environment variable', async () => {
    await import('@/lib/auth/auth');

    const authConfig = mocks.betterAuth.mock.calls[0][0];

    expect(authConfig.socialProviders.google.clientSecret).toBe(
      'google-client-secret-test',
    );
  });

  it('TC-AUTH-09 mengaktifkan plugin admin', async () => {
    await import('@/lib/auth/auth');

    expect(mocks.admin).toHaveBeenCalledTimes(1);
  });

  it('TC-AUTH-10 mengaktifkan plugin OpenAPI', async () => {
    await import('@/lib/auth/auth');

    expect(mocks.openAPI).toHaveBeenCalledTimes(1);
  });

  it('TC-AUTH-11 mengaktifkan plugin username', async () => {
    await import('@/lib/auth/auth');

    expect(mocks.username).toHaveBeenCalledTimes(1);
  });

  it('TC-AUTH-12 memasukkan plugin admin, OpenAPI, dan username ke config auth', async () => {
    await import('@/lib/auth/auth');

    const authConfig = mocks.betterAuth.mock.calls[0][0];

    expect(authConfig.plugins).toContain('admin-plugin');
    expect(authConfig.plugins).toContain('openapi-plugin');
    expect(authConfig.plugins).toContain('username-plugin');
  });

  it('TC-AUTH-13 auth memiliki API getSession untuk pengecekan session user', async () => {
    const { auth } = await import('@/lib/auth/auth');

    expect(auth.api).toBeDefined();
    expect(auth.api.getSession).toBeDefined();
    expect(typeof auth.api.getSession).toBe('function');
  });
});
