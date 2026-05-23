import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
  signInSocial: vi.fn(),
  signOut: vi.fn(),
  requestPasswordReset: vi.fn(),
  updateUser: vi.fn(),
  changePassword: vi.fn(),
  isUsernameAvailable: vi.fn(),

  createAuthClient: vi.fn(() => ({
    signIn: {
      email: mocks.signInEmail,
      social: mocks.signInSocial,
    },
    signUp: {
      email: mocks.signUpEmail,
    },
    signOut: mocks.signOut,
    requestPasswordReset: mocks.requestPasswordReset,
    updateUser: mocks.updateUser,
    changePassword: mocks.changePassword,
    isUsernameAvailable: mocks.isUsernameAvailable,
  })),

  nextCookies: vi.fn(() => 'next-cookies-plugin'),
  usernameClient: vi.fn(() => 'username-client-plugin'),
}));

vi.mock('better-auth/react', () => ({
  createAuthClient: mocks.createAuthClient,
}));

vi.mock('better-auth/client/plugins', () => ({
  usernameClient: mocks.usernameClient,
}));

vi.mock('better-auth/next-js', () => ({
  nextCookies: mocks.nextCookies,
}));

describe('Auth Client Configuration Unit Testing', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('TC-AUTH-CLIENT-01 berhasil membuat auth client', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    expect(authClient).toBeDefined();
    expect(mocks.createAuthClient).toHaveBeenCalledTimes(1);
  });

  it('TC-AUTH-CLIENT-02 menggunakan plugin nextCookies', async () => {
    await import('@/lib/auth/auth-client');

    expect(mocks.nextCookies).toHaveBeenCalledTimes(1);
  });

  it('TC-AUTH-CLIENT-03 menggunakan plugin usernameClient', async () => {
    await import('@/lib/auth/auth-client');

    expect(mocks.usernameClient).toHaveBeenCalledTimes(1);
  });

  it('TC-AUTH-CLIENT-04 memasukkan plugin nextCookies dan usernameClient ke auth client', async () => {
    await import('@/lib/auth/auth-client');

    const config = mocks.createAuthClient.mock.calls[0][0];

    expect(config.plugins).toContain('next-cookies-plugin');
    expect(config.plugins).toContain('username-client-plugin');
  });

  it('TC-AUTH-CLIENT-05 berhasil memanggil login menggunakan email dan password', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    mocks.signInEmail.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          email: 'user@mail.com',
        },
      },
      error: null,
    });

    const result = await authClient.signIn.email({
      email: 'user@mail.com',
      password: 'password123',
    });

    expect(mocks.signInEmail).toHaveBeenCalledWith({
      email: 'user@mail.com',
      password: 'password123',
    });
    expect(result.error).toBeNull();
    expect(result.data.user.email).toBe('user@mail.com');
  });

  it('TC-AUTH-CLIENT-06 gagal login email jika password salah', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    mocks.signInEmail.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Invalid email or password',
      },
    });

    const result = await authClient.signIn.email({
      email: 'user@mail.com',
      password: 'wrong-password',
    });

    expect(mocks.signInEmail).toHaveBeenCalledWith({
      email: 'user@mail.com',
      password: 'wrong-password',
    });
    expect(result.data).toBeNull();
    expect(result.error.message).toBe('Invalid email or password');
  });

  it('TC-AUTH-CLIENT-07 berhasil register menggunakan email', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    mocks.signUpEmail.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-2',
          name: 'Nikita',
          email: 'nikita@mail.com',
        },
      },
      error: null,
    });

    const result = await authClient.signUp.email({
      name: 'Nikita',
      email: 'nikita@mail.com',
      username: 'nikita',
      password: 'password123',
      callbackURL: '/login?verified=1',
    });

    expect(mocks.signUpEmail).toHaveBeenCalledWith({
      name: 'Nikita',
      email: 'nikita@mail.com',
      username: 'nikita',
      password: 'password123',
      callbackURL: '/login?verified=1',
    });
    expect(result.error).toBeNull();
    expect(result.data.user.email).toBe('nikita@mail.com');
  });

  it('TC-AUTH-CLIENT-08 gagal register jika email sudah digunakan', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    mocks.signUpEmail.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Email already exists',
      },
    });

    const result = await authClient.signUp.email({
      name: 'Nikita',
      email: 'nikita@mail.com',
      username: 'nikita',
      password: 'password123',
      callbackURL: '/login?verified=1',
    });

    expect(result.data).toBeNull();
    expect(result.error.message).toBe('Email already exists');
  });

  it('TC-AUTH-CLIENT-09 berhasil login menggunakan Google SSO', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    mocks.signInSocial.mockResolvedValueOnce({
      data: {
        url: 'https://accounts.google.com/oauth',
      },
      error: null,
    });

    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    });

    expect(mocks.signInSocial).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: '/',
    });
    expect(result.error).toBeNull();
    expect(result.data.url).toContain('google');
  });

  it('TC-AUTH-CLIENT-10 gagal Google SSO jika provider error', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    mocks.signInSocial.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Google OAuth failed',
      },
    });

    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    });

    expect(mocks.signInSocial).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: '/',
    });
    expect(result.data).toBeNull();
    expect(result.error.message).toBe('Google OAuth failed');
  });

  it('TC-AUTH-CLIENT-11 berhasil logout user', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    mocks.signOut.mockResolvedValueOnce({
      data: true,
      error: null,
    });

    const result = await authClient.signOut();

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(result.data).toBe(true);
    expect(result.error).toBeNull();
  });

  it('TC-AUTH-CLIENT-12 berhasil request reset password via email', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    mocks.requestPasswordReset.mockResolvedValueOnce({
      data: {
        success: true,
      },
      error: null,
    });

    const result = await authClient.requestPasswordReset({
      email: 'user@mail.com',
      redirectTo: 'http://localhost:3000/reset-password',
    });

    expect(mocks.requestPasswordReset).toHaveBeenCalledWith({
      email: 'user@mail.com',
      redirectTo: 'http://localhost:3000/reset-password',
    });
    expect(result.data.success).toBe(true);
  });

  it('TC-AUTH-CLIENT-13 berhasil update profile user', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    mocks.updateUser.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          username: 'nikita',
          bio: 'CareConnect user',
        },
      },
      error: null,
    });

    const result = await authClient.updateUser({
      username: 'nikita',
      image: 'https://example.com/avatar.png',
      bio: 'CareConnect user',
      phoneNumber: '08123456789',
      dateOfBirth: new Date('2004-01-01'),
      gender: 'female',
    });

    expect(mocks.updateUser).toHaveBeenCalledWith({
      username: 'nikita',
      image: 'https://example.com/avatar.png',
      bio: 'CareConnect user',
      phoneNumber: '08123456789',
      dateOfBirth: new Date('2004-01-01'),
      gender: 'female',
    });
    expect(result.error).toBeNull();
    expect(result.data.user.username).toBe('nikita');
  });

  it('TC-AUTH-CLIENT-14 gagal update profile jika username sudah digunakan', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    mocks.updateUser.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Username already taken',
      },
    });

    const result = await authClient.updateUser({
      username: 'taken_username',
    });

    expect(result.data).toBeNull();
    expect(result.error.message).toBe('Username already taken');
  });

  it('TC-AUTH-CLIENT-15 berhasil cek username tersedia', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    mocks.isUsernameAvailable.mockResolvedValueOnce({
      data: {
        available: true,
      },
      error: null,
    });

    const result = await authClient.isUsernameAvailable({
      username: 'nikita',
    });

    expect(mocks.isUsernameAvailable).toHaveBeenCalledWith({
      username: 'nikita',
    });
    expect(result.data.available).toBe(true);
  });

  it('TC-AUTH-CLIENT-16 gagal cek username jika username tidak tersedia', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    mocks.isUsernameAvailable.mockResolvedValueOnce({
      data: {
        available: false,
      },
      error: null,
    });

    const result = await authClient.isUsernameAvailable({
      username: 'admin',
    });

    expect(result.data.available).toBe(false);
  });

  it('TC-AUTH-CLIENT-17 berhasil mengganti password', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    mocks.changePassword.mockResolvedValueOnce({
      data: {
        success: true,
      },
      error: null,
    });

    const result = await authClient.changePassword({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      revokeOtherSessions: true,
    });

    expect(mocks.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      revokeOtherSessions: true,
    });
    expect(result.data.success).toBe(true);
  });

  it('TC-AUTH-CLIENT-18 gagal mengganti password jika password lama salah', async () => {
    const { authClient } = await import('@/lib/auth/auth-client');

    mocks.changePassword.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Invalid current password',
      },
    });

    const result = await authClient.changePassword({
      currentPassword: 'wrong-old-password',
      newPassword: 'new-password',
      revokeOtherSessions: true,
    });

    expect(result.data).toBeNull();
    expect(result.error.message).toBe('Invalid current password');
  });
});
