import { type ErrorCode } from '@/lib/error';
import { NextResponse } from 'next/server';

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
};

export function ok<T>(data: T, status = 200, meta?: Record<string, unknown>) {
  const payload: ApiSuccess<T> = meta
    ? { success: true, data, meta }
    : { success: true, data };

  return NextResponse.json(payload, { status });
}

export function created<T>(data: T, meta?: Record<string, unknown>) {
  return ok(data, 201, meta);
}

export function fail(
  code: ErrorCode,
  message: string,
  status = 400,
  details?: unknown,
) {
  const payload: ApiFailure = {
    success: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };

  return NextResponse.json(payload, { status });
}
