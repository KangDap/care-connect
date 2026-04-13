export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'INTERNAL_SERVER_ERROR'
  | 'STORAGE_ERROR';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const Errors = {
  badRequest: (message = 'Bad request', details?: unknown) =>
    new ApiError(400, 'BAD_REQUEST', message, details),

  unauthorized: (message = 'Unauthorized', details?: unknown) =>
    new ApiError(401, 'UNAUTHORIZED', message, details),

  forbidden: (message = 'Forbidden', details?: unknown) =>
    new ApiError(403, 'FORBIDDEN', message, details),

  notFound: (message = 'Resource not found', details?: unknown) =>
    new ApiError(404, 'NOT_FOUND', message, details),

  conflict: (message = 'Conflict', details?: unknown) =>
    new ApiError(409, 'CONFLICT', message, details),

  unprocessable: (message = 'Unprocessable entity', details?: unknown) =>
    new ApiError(422, 'UNPROCESSABLE_ENTITY', message, details),

  storage: (message = 'Storage operation failed', details?: unknown) =>
    new ApiError(500, 'STORAGE_ERROR', message, details),

  internal: (message = 'Internal server error', details?: unknown) =>
    new ApiError(500, 'INTERNAL_SERVER_ERROR', message, details),
};

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
