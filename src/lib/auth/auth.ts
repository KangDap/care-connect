import {
  sendExistingUserSignUpAttemptEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from '@/lib/email/email';
import { prisma } from '@/lib/prisma';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, genericOAuth, openAPI, username } from 'better-auth/plugins';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:*',
    'https://careconnect.fmipa.unpad.ac.id',
    'https://careconnect.fmipa.stg.unpad.ac.id',
    'https://*.unpad.ac.id',
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],
  user: {
    additionalFields: {
      role: {
        type: ['USER', 'PSYCHOLOGIST', 'ADMIN'],
        required: true,
        defaultValue: 'USER',
        input: false,
      },
      bio: {
        type: 'string',
        required: false,
      },
      dateOfBirth: {
        type: 'date',
        required: false,
        fieldName: 'date_of_birth',
      },
      gender: {
        type: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
        required: false,
        defaultValue: 'PREFER_NOT_TO_SAY',
      },
      phoneNumber: {
        type: 'string',
        required: false,
        fieldName: 'phone_number',
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      void sendResetPasswordEmail({ user, url });
    },
    onExistingUserSignUp: async ({ user }) => {
      void sendExistingUserSignUpAttemptEmail(user.email);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      void sendVerificationEmail({ user, url });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => {
        const email = profile.email ?? '';
        const emailPrefix = email.split('@')[0] || 'user';
        return {
          username: emailPrefix,
          displayUsername: profile.name,
          image: profile.picture,
        };
      },
    },
  },
  plugins: [
    admin(),
    openAPI(),
    username(),
    ...(process.env.PAUS_CLIENT_ID
      ? [
          genericOAuth({
            config: [
              {
                providerId: 'paus',
                clientId: process.env.PAUS_CLIENT_ID,
                clientSecret: process.env.PAUS_CLIENT_SECRET,

                authorizationUrl:
                  process.env.PAUS_AUTHORIZATION_URL ||
                  'https://paus.unpad.ac.id/oauth/authorize',

                tokenUrl:
                  process.env.PAUS_TOKEN_URL ||
                  'https://paus.unpad.ac.id/oauth/token',

                userInfoUrl:
                  process.env.PAUS_USER_INFO_URL ||
                  'https://paus.unpad.ac.id/api/user',

                getUserInfo: async (tokens) => {
                  const url =
                    process.env.PAUS_USER_INFO_URL ||
                    'https://paus.unpad.ac.id/api/user';
                  const res = await fetch(url, {
                    headers: {
                      Authorization: `Bearer ${tokens.accessToken}`,
                    },
                  });
                  const profile = (await res
                    .json()
                    .catch(() => ({}))) as Record<string, unknown>;
                  const email = (profile.email as string) || '';
                  const userSub =
                    (profile.username as string) ||
                    (profile.npm as string) ||
                    email.split('@')[0] ||
                    'user';
                  const name =
                    (profile.name as string) ||
                    (profile.nama as string) ||
                    userSub;
                  return {
                    id: String(profile.id || profile.sub || userSub),
                    name,
                    email,
                    emailVerified: true,
                  };
                },
              },
            ],
          }),
        ]
      : []),
  ],
});

export type Session = typeof auth.$Infer.Session;
