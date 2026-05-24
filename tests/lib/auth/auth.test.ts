import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  betterAuth: vi.fn((config) => ({
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
    config,
    $Infer: {
      Session: {},
    },
  })),

  prismaAdapter: vi.fn((prisma, options) => ({
    adapter: 'prisma-adapter',
    prisma,
    options,
  })),

  admin: vi.fn(() => 'admin-plugin'),
  openAPI: vi.fn(() => 'openapi-plugin'),
  username: vi.fn(() => 'username-plugin'),

  sendResetPasswordEmail: vi.fn(),
  sendExistingUserSignUpAttemptEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),

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

vi.mock('@/lib/email/email', () => ({
  sendResetPasswordEmail: mocks.sendResetPasswordEmail,
  sendExistingUserSignUpAttemptEmail: mocks.sendExistingUserSignUpAttemptEmail,
  sendVerificationEmail: mocks.sendVerificationEmail,
}));

const importAuthAndGetConfig = async () => {
  const { auth } = await import('@/lib/auth/auth');
  const config = mocks.betterAuth.mock.calls[0][0];

  return {
    auth,
    config,
  };
};

describe('Auth Server Configuration Unit Testing', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    process.env.GOOGLE_CLIENT_ID = 'google-client-id-test';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret-test';
  });

  it('TC-AUTH-01 berhasil membuat konfigurasi auth server', async () => {
    const { auth } = await importAuthAndGetConfig();

    expect(auth).toBeDefined();
    expect(mocks.betterAuth).toHaveBeenCalledTimes(1);
  });

  it('TC-AUTH-02 menggunakan Prisma adapter sebagai database auth', async () => {
    await importAuthAndGetConfig();

    expect(mocks.prismaAdapter).toHaveBeenCalledTimes(1);
    expect(mocks.prismaAdapter).toHaveBeenCalledWith(mocks.prisma, {
      provider: 'postgresql',
    });
  });

  it('TC-AUTH-03 mengaktifkan login menggunakan email dan password', async () => {
    const { config } = await importAuthAndGetConfig();

    expect(config.emailAndPassword).toBeDefined();
    expect(config.emailAndPassword.enabled).toBe(true);
  });

  it('TC-AUTH-04 mengaktifkan verifikasi email pada email login', async () => {
    const { config } = await importAuthAndGetConfig();

    expect(config.emailAndPassword.requireEmailVerification).toBe(true);
  });

  it('TC-AUTH-05 auto sign in setelah register dinonaktifkan', async () => {
    const { config } = await importAuthAndGetConfig();

    expect(config.emailAndPassword.autoSignIn).toBe(false);
  });

  it('TC-AUTH-06 mengaktifkan Google SSO provider', async () => {
    const { config } = await importAuthAndGetConfig();

    expect(config.socialProviders).toBeDefined();
    expect(config.socialProviders.google).toBeDefined();
  });

  it('TC-AUTH-07 Google SSO menggunakan clientId dari environment variable', async () => {
    const { config } = await importAuthAndGetConfig();

    expect(config.socialProviders.google.clientId).toBe(
      'google-client-id-test',
    );
  });

  it('TC-AUTH-08 Google SSO menggunakan clientSecret dari environment variable', async () => {
    const { config } = await importAuthAndGetConfig();

    expect(config.socialProviders.google.clientSecret).toBe(
      'google-client-secret-test',
    );
  });

  it('TC-AUTH-09 mengaktifkan plugin admin', async () => {
    await importAuthAndGetConfig();

    expect(mocks.admin).toHaveBeenCalledTimes(1);
  });

  it('TC-AUTH-10 mengaktifkan plugin OpenAPI', async () => {
    await importAuthAndGetConfig();

    expect(mocks.openAPI).toHaveBeenCalledTimes(1);
  });

  it('TC-AUTH-11 mengaktifkan plugin username', async () => {
    await importAuthAndGetConfig();

    expect(mocks.username).toHaveBeenCalledTimes(1);
  });

  it('TC-AUTH-12 memasukkan plugin admin, OpenAPI, dan username ke config auth', async () => {
    const { config } = await importAuthAndGetConfig();

    expect(config.plugins).toContain('admin-plugin');
    expect(config.plugins).toContain('openapi-plugin');
    expect(config.plugins).toContain('username-plugin');
  });

  it('TC-AUTH-13 auth memiliki API getSession untuk pengecekan session user', async () => {
    const { auth } = await importAuthAndGetConfig();

    expect(auth.api).toBeDefined();
    expect(auth.api.getSession).toBeDefined();
    expect(typeof auth.api.getSession).toBe('function');
  });
});

describe('Auth User Additional Fields Unit Testing', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    process.env.GOOGLE_CLIENT_ID = 'google-client-id-test';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret-test';
  });

  it('TC-AUTH-FIELD-01 mendefinisikan role sebagai additional field wajib dengan default USER', async () => {
    const { config } = await importAuthAndGetConfig();

    expect(config.user.additionalFields.role).toEqual({
      type: ['USER', 'PSYCHOLOGIST', 'ADMIN'],
      required: true,
      defaultValue: 'USER',
      input: false,
    });
  });

  it('TC-AUTH-FIELD-02 mendefinisikan bio sebagai optional string field', async () => {
    const { config } = await importAuthAndGetConfig();

    expect(config.user.additionalFields.bio).toEqual({
      type: 'string',
      required: false,
    });
  });

  it('TC-AUTH-FIELD-03 mendefinisikan dateOfBirth dengan fieldName date_of_birth', async () => {
    const { config } = await importAuthAndGetConfig();

    expect(config.user.additionalFields.dateOfBirth).toEqual({
      type: 'date',
      required: false,
      fieldName: 'date_of_birth',
    });
  });

  it('TC-AUTH-FIELD-04 mendefinisikan gender dengan default PREFER_NOT_TO_SAY', async () => {
    const { config } = await importAuthAndGetConfig();

    expect(config.user.additionalFields.gender).toEqual({
      type: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
      required: false,
      defaultValue: 'PREFER_NOT_TO_SAY',
    });
  });

  it('TC-AUTH-FIELD-05 mendefinisikan phoneNumber dengan fieldName phone_number', async () => {
    const { config } = await importAuthAndGetConfig();

    expect(config.user.additionalFields.phoneNumber).toEqual({
      type: 'string',
      required: false,
      fieldName: 'phone_number',
    });
  });
});

describe('Auth Email Callback Unit Testing', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    process.env.GOOGLE_CLIENT_ID = 'google-client-id-test';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret-test';
  });

  it('TC-AUTH-EMAIL-01 memanggil sendResetPasswordEmail saat reset password diminta', async () => {
    const { config } = await importAuthAndGetConfig();

    const user = {
      id: 'user-1',
      email: 'user@mail.com',
      name: 'Niki',
    };

    const url = 'http://localhost:3000/reset-password/token';

    await config.emailAndPassword.sendResetPassword({
      user,
      url,
    });

    expect(mocks.sendResetPasswordEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendResetPasswordEmail).toHaveBeenCalledWith({
      user,
      url,
    });
  });

  it('TC-AUTH-EMAIL-02 memanggil sendExistingUserSignUpAttemptEmail saat user lama mencoba sign up', async () => {
    const { config } = await importAuthAndGetConfig();

    await config.emailAndPassword.onExistingUserSignUp({
      user: {
        id: 'user-1',
        email: 'existing@mail.com',
        name: 'Existing User',
      },
    });

    expect(mocks.sendExistingUserSignUpAttemptEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendExistingUserSignUpAttemptEmail).toHaveBeenCalledWith(
      'existing@mail.com',
    );
  });

  it('TC-AUTH-EMAIL-03 konfigurasi email verification aktif saat sign up dan sign in', async () => {
    const { config } = await importAuthAndGetConfig();

    expect(config.emailVerification.sendOnSignUp).toBe(true);
    expect(config.emailVerification.sendOnSignIn).toBe(true);
    expect(config.emailVerification.expiresIn).toBe(60 * 60);
  });

  it('TC-AUTH-EMAIL-04 memanggil sendVerificationEmail saat email verification dikirim', async () => {
    const { config } = await importAuthAndGetConfig();

    const user = {
      id: 'user-1',
      email: 'verify@mail.com',
      name: 'Verify User',
    };

    const url = 'http://localhost:3000/verify-email/token';

    await config.emailVerification.sendVerificationEmail({
      user,
      url,
    });

    expect(mocks.sendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendVerificationEmail).toHaveBeenCalledWith({
      user,
      url,
    });
  });
});

describe('Auth Google SSO Profile Mapping Unit Testing', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    process.env.GOOGLE_CLIENT_ID = 'google-client-id-test';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret-test';
  });

  it('TC-AUTH-GOOGLE-01 memetakan profile Google menjadi username, displayUsername, dan image', async () => {
    const { config } = await importAuthAndGetConfig();

    const result = config.socialProviders.google.mapProfileToUser({
      email: 'niki@example.com',
      name: 'Niki Putri',
      picture: 'https://example.com/avatar.png',
    });

    expect(result).toEqual({
      username: 'niki',
      displayUsername: 'Niki Putri',
      image: 'https://example.com/avatar.png',
    });
  });

  it('TC-AUTH-GOOGLE-02 menggunakan fallback username user jika email kosong', async () => {
    const { config } = await importAuthAndGetConfig();

    const result = config.socialProviders.google.mapProfileToUser({
      email: '',
      name: 'No Email User',
      picture: 'https://example.com/no-email.png',
    });

    expect(result).toEqual({
      username: 'user',
      displayUsername: 'No Email User',
      image: 'https://example.com/no-email.png',
    });
  });

  it('TC-AUTH-GOOGLE-03 menggunakan fallback username user jika email undefined', async () => {
    const { config } = await importAuthAndGetConfig();

    const result = config.socialProviders.google.mapProfileToUser({
      name: 'Undefined Email User',
      picture: 'https://example.com/no-email.png',
    });

    expect(result).toEqual({
      username: 'user',
      displayUsername: 'Undefined Email User',
      image: 'https://example.com/no-email.png',
    });
  });
});
