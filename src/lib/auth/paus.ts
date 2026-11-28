import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

const stableId = z.union([
  z.string().trim().min(1),
  z.number().int().nonnegative(),
]);

const pausProfile = z
  .object({
    id: stableId.optional(),
    sub: stableId.optional(),
    email: z.email(),
    name: z.string().trim().min(1).optional(),
    nama: z.string().trim().min(1).optional(),
    email_verified: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
  })
  .refine((profile) => profile.id !== undefined || profile.sub !== undefined);

function safeEndpoint(value: string) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '[invalid URL]';
  }
}

function reportUserInfoFailure(extra: Record<string, unknown>) {
  try {
    Sentry.captureException(new Error('PAuS user info fetch failed'), {
      tags: {
        feature: 'auth',
        'auth.provider': 'paus',
        stage: 'user_info',
      },
      extra,
    });
  } catch {
    // Reporting must not affect authentication.
  }
}

export async function getPausUserInfo(accessToken: string) {
  const baseUrl = process.env.PAUS_USER_INFO_URL || '';
  if (!baseUrl) {
    reportUserInfoFailure({
      configuration_error: 'PAUS_USER_INFO_URL_MISSING',
    });
    return null;
  }
  const url = new URL(baseUrl);
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });

  const rawBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    reportUserInfoFailure({
      endpoint: safeEndpoint(baseUrl),
      http_status: response.status,
    });
    return null;
  }

  if (
    rawBody &&
    typeof rawBody === 'object' &&
    'error' in rawBody &&
    (rawBody as Record<string, unknown>).error
  ) {
    reportUserInfoFailure({
      endpoint: safeEndpoint(baseUrl),
      http_status: response.status,
      provider_error: String((rawBody as Record<string, unknown>).error),
    });
    return null;
  }

  const result = pausProfile.safeParse(rawBody);
  if (!result.success) {
    reportUserInfoFailure({
      endpoint: safeEndpoint(baseUrl),
      http_status: response.status,
      received_keys:
        rawBody && typeof rawBody === 'object' ? Object.keys(rawBody) : [],
      validation_issues: result.error.issues.map((i) => ({
        path: i.path.join('.'),
        code: i.code,
      })),
    });
    return null;
  }

  const profile = result.data;
  return {
    id: String(profile.id ?? profile.sub),
    name: profile.name ?? profile.nama ?? profile.email.split('@')[0],
    email: profile.email,
    emailVerified:
      profile.email_verified === true || profile.emailVerified === true,
  };
}
