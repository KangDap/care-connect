// @vitest-environment node
import { handleArticleRequest } from '@/app/api/articles/_shared';
import { Errors } from '@/lib/error';
import { reportServerError } from '@/lib/server-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  captureException: vi.fn(() => 'event-reference'),
}));
vi.mock('@sentry/nextjs', () => ({ captureException: mocks.captureException }));

describe('server exception reporting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('keeps the database code but omits raw messages, query data and causes', () => {
    const error = Object.assign(
      new Error('private credential and query parameters'),
      { code: 'P2021', meta: { modelName: 'User', query: 'private query' } },
    );
    expect(reportServerError(error, 'article')).toBe('event-reference');
    const [event, context] = mocks.captureException.mock
      .calls[0] as unknown as [Error, { tags: Record<string, string> }];
    expect(event.message).toContain('P2021');
    expect(event.stack).not.toContain('private credential');
    expect(context.tags.error_code).toBe('P2021');
    expect(context.tags.db_model).toBe('User');
    expect(JSON.stringify(mocks.captureException.mock.calls)).not.toContain(
      'private',
    );
  });

  it('reports unexpected article failures and returns the event reference', async () => {
    const response = await handleArticleRequest(async () => {
      throw Object.assign(new Error('private'), { code: 'P2022' });
    });
    expect(response.status).toBe(500);
    expect(response.headers.get('X-Error-Reference')).toBe('event-reference');
    expect((await response.json()).error.details.reference).toBe(
      'event-reference',
    );
    expect(mocks.captureException).toHaveBeenCalledTimes(1);
  });

  it('does not report expected validation errors', async () => {
    const response = await handleArticleRequest(async () => {
      throw Errors.badRequest('Invalid category');
    });
    expect(response.status).toBe(400);
    expect(mocks.captureException).not.toHaveBeenCalled();
  });
});
