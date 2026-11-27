import * as Sentry from '@sentry/nextjs';
import { validateAuthorizationCode } from 'better-auth/oauth2';

type ExchangeData = {
  code: string;
  redirectURI: string;
  codeVerifier?: string;
  deviceId?: string;
};

function safeEndpoint(value: string) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '[invalid URL]';
  }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

// Only recognized protocol/network codes are sent, never arbitrary provider text.
function safeCode(value: unknown) {
  return typeof value === 'string' &&
    /^(invalid_request|invalid_client|invalid_grant|unauthorized_client|unsupported_grant_type|invalid_scope|server_error|temporarily_unavailable|access_denied|ECONNREFUSED|ECONNRESET|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT|CERT_HAS_EXPIRED|UNABLE_TO_VERIFY_LEAF_SIGNATURE)$/.test(
      value,
    )
    ? value
    : undefined;
}

export async function exchangePausToken(data: ExchangeData) {
  const endpoint =
    process.env.PAUS_TOKEN_URL || 'https://paus.unpad.ac.id/oauth/token';
  const redirectURI = process.env.PAUS_REDIRECT_URI || data.redirectURI;
  const started = Date.now();
  const context = {
    endpoint: safeEndpoint(endpoint),
    redirect_uri: safeEndpoint(redirectURI),
    method: 'POST',
    authentication: process.env.PAUS_CLIENT_SECRET
      ? 'client_secret_post'
      : 'none',
    client_id_configured: Boolean(process.env.PAUS_CLIENT_ID),
    client_secret_configured: Boolean(process.env.PAUS_CLIENT_SECRET),
    code_present: Boolean(data.code),
    pkce: false,
  };
  try {
    const tokens = await validateAuthorizationCode({
      code: data.code,
      redirectURI: data.redirectURI,
      deviceId: data.deviceId,
      options: {
        clientId: process.env.PAUS_CLIENT_ID || '',
        clientSecret: process.env.PAUS_CLIENT_SECRET,
        redirectURI: process.env.PAUS_REDIRECT_URI,
      },
      tokenEndpoint: endpoint,
    });
    try {
      Sentry.captureMessage('PAuS token exchange succeeded', {
        level: 'info',
        tags: {
          feature: 'auth',
          'auth.provider': 'paus',
          stage: 'token_exchange',
        },
        extra: {
          ...context,
          duration_ms: Date.now() - started,
          access_token_present: Boolean(tokens.accessToken),
        },
      });
    } catch {
      // Reporting must not affect authentication.
    }
    return tokens;
  } catch (error) {
    const details = record(error);
    const body = record(details.body);
    const cause = record(details.cause);
    const status = details.status ?? details.statusCode;
    const diagnostic = {
      ...context,
      duration_ms: Date.now() - started,
      http_status: typeof status === 'number' ? status : undefined,
      provider_error: safeCode(details.error) ?? safeCode(body.error),
      network_code: safeCode(details.code) ?? safeCode(cause.code),
      redirect_refused:
        error instanceof Error &&
        error.message.includes('returned an HTTP redirect'),
    };
    try {
      Sentry.captureException(new Error('PAuS token exchange failed'), {
        tags: {
          feature: 'auth',
          'auth.provider': 'paus',
          stage: 'token_exchange',
        },
        extra: diagnostic,
      });
    } catch {
      // Preserve the original OAuth failure even if Sentry is unavailable.
    }
    throw error;
  }
}
