import { created, fail, ok } from '@/lib/api-response';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, options?: { status?: number }) =>
      new Response(JSON.stringify(data), {
        status: options?.status || 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  },
}));

describe('API Response helpers', () => {
  describe('ok() function', () => {
    it('should return success response with default 200 status', async () => {
      const data = { id: 1, title: 'Test' };
      const response = ok(data);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({
        success: true,
        data,
      });
    });

    it('should return success response with custom status', async () => {
      const data = { id: 1 };
      const response = ok(data, 202);

      expect(response.status).toBe(202);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data).toEqual(data);
    });

    it('should include meta when provided', async () => {
      const data = { id: 1 };
      const meta = { total: 10, page: 1 };
      const response = ok(data, 200, meta);

      const json = await response.json();
      expect(json).toEqual({
        success: true,
        data,
        meta,
      });
    });

    it('should not include meta when undefined', async () => {
      const data = { id: 1 };
      const response = ok(data, 200);

      const json = await response.json();
      expect(json).not.toHaveProperty('meta');
      expect(json).toEqual({
        success: true,
        data,
      });
    });

    it('should handle empty data', async () => {
      const response = ok(null);

      const json = await response.json();
      expect(json).toEqual({
        success: true,
        data: null,
      });
    });

    it('should handle array data', async () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = ok(data);

      const json = await response.json();
      expect(json.data).toEqual(data);
    });
  });

  describe('created() function', () => {
    it('should return success response with 201 status', async () => {
      const data = { id: 1, title: 'New Consultation' };
      const response = created(data);

      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json).toEqual({
        success: true,
        data,
      });
    });

    it('should include meta when provided', async () => {
      const data = { id: 1 };
      const meta = { createdAt: '2026-04-09' };
      const response = created(data, meta);

      const json = await response.json();
      expect(json).toEqual({
        success: true,
        data,
        meta,
      });
    });
  });

  describe('fail() function', () => {
    it('should return error response with 400 status by default', async () => {
      const response = fail('BAD_REQUEST', 'Missing fields');

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Missing fields',
        },
      });
    });

    it('should return error response with custom status', async () => {
      const response = fail('UNAUTHORIZED', 'Invalid token', 401);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('should include details when provided', async () => {
      const details = {
        errors: [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Too short' },
        ],
      };
      const response = fail(
        'UNPROCESSABLE_ENTITY',
        'Validation failed',
        422,
        details,
      );

      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: {
          code: 'UNPROCESSABLE_ENTITY',
          message: 'Validation failed',
          details,
        },
      });
    });

    it('should not include details when undefined', async () => {
      const response = fail('NOT_FOUND', 'User not found', 404);

      const json = await response.json();
      expect(json).not.toHaveProperty('error.details');
      expect(json.error).toEqual({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    });

    it('should handle 500 status for server errors', async () => {
      const response = fail('INTERNAL_SERVER_ERROR', 'Server error', 500);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should handle storage error', async () => {
      const response = fail('STORAGE_ERROR', 'File upload failed', 500, {
        reason: 'Bucket not accessible',
      });

      const json = await response.json();
      expect(json.error.code).toBe('STORAGE_ERROR');
      expect(json.error.details).toEqual({
        reason: 'Bucket not accessible',
      });
    });
  });

  describe('Response types and structures', () => {
    it('should always have success field in ok response', async () => {
      const response = ok({ data: 'test' });
      const json = await response.json();

      expect(json).toHaveProperty('success');
      expect(json.success).toBe(true);
    });

    it('should always have success field in fail response', async () => {
      const response = fail('BAD_REQUEST', 'Error');
      const json = await response.json();

      expect(json).toHaveProperty('success');
      expect(json.success).toBe(false);
    });

    it('should have proper error structure in fail response', async () => {
      const response = fail('CONFLICT', 'Duplicate entry');
      const json = await response.json();

      expect(json.error).toHaveProperty('code');
      expect(json.error).toHaveProperty('message');
      expect(typeof json.error.code).toBe('string');
      expect(typeof json.error.message).toBe('string');
    });
  });
});
