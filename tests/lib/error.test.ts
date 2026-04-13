import { ApiError, Errors, isApiError } from '@/lib/error';
import { describe, expect, it } from 'vitest';

describe('ApiError class', () => {
  it('should create ApiError instance with correct properties', () => {
    const error = new ApiError(400, 'BAD_REQUEST', 'Test message', {
      field: 'test',
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.message).toBe('Test message');
    expect(error.details).toEqual({ field: 'test' });
    expect(error.name).toBe('ApiError');
  });

  it('should allow ApiError without details', () => {
    const error = new ApiError(401, 'UNAUTHORIZED', 'Unauthorized access');

    expect(error.status).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.message).toBe('Unauthorized access');
    expect(error.details).toBeUndefined();
  });
});

describe('Errors factory', () => {
  it('should create badRequest error with 400 status', () => {
    const error = Errors.badRequest('Title is required', { field: 'title' });

    expect(error.status).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.message).toBe('Title is required');
    expect(error.details).toEqual({ field: 'title' });
  });

  it('should create unauthorized error with 401 status', () => {
    const error = Errors.unauthorized('Session expired');

    expect(error.status).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.message).toBe('Session expired');
  });

  it('should create forbidden error with 403 status', () => {
    const error = Errors.forbidden('Access denied');

    expect(error.status).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toBe('Access denied');
  });

  it('should create notFound error with 404 status', () => {
    const error = Errors.notFound('Consultation not found');

    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Consultation not found');
  });

  it('should create conflict error with 409 status', () => {
    const error = Errors.conflict('Email already exists');

    expect(error.status).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(error.message).toBe('Email already exists');
  });

  it('should create unprocessable error with 422 status', () => {
    const error = Errors.unprocessable('Invalid data format', { errors: [] });

    expect(error.status).toBe(422);
    expect(error.code).toBe('UNPROCESSABLE_ENTITY');
    expect(error.message).toBe('Invalid data format');
    expect(error.details).toEqual({ errors: [] });
  });

  it('should create storage error with 500 status', () => {
    const error = Errors.storage('Upload failed');

    expect(error.status).toBe(500);
    expect(error.code).toBe('STORAGE_ERROR');
    expect(error.message).toBe('Upload failed');
  });

  it('should create internal error with 500 status', () => {
    const error = Errors.internal('Something went wrong');

    expect(error.status).toBe(500);
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.message).toBe('Something went wrong');
  });

  it('should use default messages when not provided', () => {
    expect(Errors.badRequest().message).toBe('Bad request');
    expect(Errors.unauthorized().message).toBe('Unauthorized');
    expect(Errors.forbidden().message).toBe('Forbidden');
    expect(Errors.notFound().message).toBe('Resource not found');
    expect(Errors.conflict().message).toBe('Conflict');
    expect(Errors.unprocessable().message).toBe('Unprocessable entity');
    expect(Errors.storage().message).toBe('Storage operation failed');
    expect(Errors.internal().message).toBe('Internal server error');
  });
});

describe('isApiError guard', () => {
  it('should return true for ApiError instance', () => {
    const error = Errors.badRequest('Test');

    expect(isApiError(error)).toBe(true);
  });

  it('should return false for regular Error', () => {
    const error = new Error('Regular error');

    expect(isApiError(error)).toBe(false);
  });

  it('should return false for plain object', () => {
    const error = { code: 'BAD_REQUEST', message: 'Test' };

    expect(isApiError(error)).toBe(false);
  });

  it('should return false for null or undefined', () => {
    expect(isApiError(null)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
  });

  it('should return false for string', () => {
    expect(isApiError('error')).toBe(false);
  });
});
