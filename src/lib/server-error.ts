import * as Sentry from '@sentry/nextjs';
import { randomUUID } from 'node:crypto';

/** Report diagnostic categories and stack frames, never raw SQL, tokens or messages. */
export function reportServerError(error: unknown, feature: 'auth' | 'article') {
  const record =
    error && typeof error === 'object'
      ? (error as {
          code?: unknown;
          meta?: { modelName?: unknown };
          message?: unknown;
        })
      : undefined;
  let code = 'UNEXPECTED_ERROR';
  if (
    typeof record?.code === 'string' &&
    /^(P\d{4}|[0-9A-Z]{5}|ENOENT|ECONNREFUSED|ETIMEDOUT)$/.test(record.code)
  ) {
    code = record.code;
  } else if (
    typeof record?.message === 'string' &&
    /default secret|BETTER_AUTH_SECRET/.test(record.message)
  ) {
    code = 'AUTH_SECRET_CONFIGURATION';
  }
  const safe = new Error(`${feature} server failure (${code})`);
  safe.name = 'ServerOperationError';
  if (error instanceof Error && error.stack) {
    const frames = error.stack
      .split('\n')
      .filter((line) => /^\s*at /.test(line))
      .slice(0, 30)
      .map((line) => line.replace(/https?:\/\/[^\s)]+/g, '[remote frame]'));
    if (frames.length)
      safe.stack = `${safe.name}: ${safe.message}\n${frames.join('\n')}`;
  }
  const tags: Record<string, string> = { feature, error_code: code };
  const model = record?.meta?.modelName;
  if (typeof model === 'string' && /^[A-Za-z_]\w{0,59}$/.test(model))
    tags.db_model = model;
  // A reporting transport must not prevent returning the original API failure.
  let reference = randomUUID() as string;
  try {
    reference = Sentry.captureException(safe, { tags }) || reference;
  } catch {
    // Keep the local reference if the SDK itself is unavailable.
  }
  console.error('[server-error]', { feature, code, reference });
  return reference;
}
