import { reportServerError } from '@/lib/server-error';
import { AsyncLocalStorage } from 'node:async_hooks';

const reports = new AsyncLocalStorage<{ reference?: string }>();

/** Better Auth may catch an exception internally before returning HTTP 500. */
export function reportAuthError(error: unknown) {
  const status =
    error && typeof error === 'object'
      ? (error as { statusCode?: unknown; status?: unknown })
      : undefined;
  const numericStatus = status?.statusCode ?? status?.status;
  if (
    typeof numericStatus === 'number' &&
    numericStatus >= 300 &&
    numericStatus < 500
  )
    return;
  const state = reports.getStore();
  if (state?.reference) return state.reference;
  const reference = reportServerError(error, 'auth');
  if (state) state.reference = reference;
  return reference;
}

/** Include dynamic auth module loading in operation, so bootstrap errors are caught. */
export function runAuthRequest(
  request: Request,
  operation: () => Promise<Response>,
) {
  return reports.run({}, async () => {
    let response: Response | undefined;
    try {
      response = await operation();
      if (response.status < 500) return response;
    } catch (error) {
      reportAuthError(error);
    }
    const reference =
      reports.getStore()?.reference ??
      reportAuthError(new Error('Auth handler returned a server error'))!;
    const headers = new Headers(response?.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Error-Reference', reference);
    // No request body, query string, cookies or provider token is logged.
    console.error('[auth-request-failed]', {
      method: request.method,
      reference,
    });
    return Response.json(
      {
        code: 'AUTH_SERVER_ERROR',
        message: 'Login could not be processed. Please try again later.',
        reference,
      },
      { status: response?.status ?? 500, headers },
    );
  });
}
