import {
  sendResetPasswordEmail,
  sendVerificationEmail,
} from '@/lib/email/email';
import { prisma } from '@/lib/prisma';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, openAPI, username } from 'better-auth/plugins';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
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
          name: emailPrefix,
          image: profile.picture,
        };
      },
    },
  },
  plugins: [admin(), openAPI(), username()],
});

export type Session = typeof auth.$Infer.Session;
