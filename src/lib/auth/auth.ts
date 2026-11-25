import { getPausUserInfo } from '@/lib/auth/paus';
import { reportAuthError } from '@/lib/auth/reporting';
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
  onAPIError: {
    onError: (error) => {
      reportAuthError(error);
    },
  },
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
                scopes: ['user.basic'],
                pkce: true,

                redirectURI: process.env.PAUS_REDIRECT_URI,

                authorizationUrl:
                  process.env.PAUS_AUTHORIZATION_URL ||
                  'https://paus.unpad.ac.id/oauth/authorize',

                tokenUrl:
                  process.env.PAUS_TOKEN_URL ||
                  'https://paus.unpad.ac.id/oauth/token',

                userInfoUrl:
                  process.env.PAUS_USER_INFO_URL ||
                  'https://paus.unpad.ac.id/api/user',

                getUserInfo: async (tokens) =>
                  tokens.accessToken
                    ? getPausUserInfo(tokens.accessToken)
                    : null,
              },
            ],
          }),
        ]
      : []),
  ],
});

export type Session = typeof auth.$Infer.Session;
