import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Donation Client Unit Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create report donation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 1,
          amount: 50000,
          paymentStatus: 'PENDING',
          paymentUrl: 'https://payment.test',
        },
      }),
    });

    const payload = {
      reportId: 1,
      amount: 50000,
      paymentMethod: 'QRIS',
      donationType: 'REPORT',
    };

    const response = await fetch('/api/donation', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.success).toBe(true);
    expect(result.data.amount).toBe(50000);
  });

  it('should successfully create platform donation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 2,
          amount: 100000,
          donationType: 'PLATFORM',
        },
      }),
    });

    const response = await fetch('/api/donation/platform', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100000,
        paymentMethod: 'BANK_TRANSFER',
        donationType: 'PLATFORM',
      }),
    });

    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.data.donationType).toBe('PLATFORM');
  });

  it('should handle donation creation failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid donation amount',
        },
      }),
    });

    const response = await fetch('/api/donation', {
      method: 'POST',
      body: JSON.stringify({
        amount: -1000,
      }),
    });

    const result = await response.json();

    expect(response.ok).toBe(false);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('BAD_REQUEST');
  });

  it('should successfully cancel pending donation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 1,
          paymentStatus: 'CANCELLED',
        },
      }),
    });

    const response = await fetch('/api/donation/1', {
      method: 'PATCH',
    });

    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.data.paymentStatus).toBe('CANCELLED');
  });

  it('should fail cancelling paid donation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Only PENDING can be cancelled',
        },
      }),
    });

    const response = await fetch('/api/donation/1', {
      method: 'PATCH',
    });

    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Only PENDING can be cancelled');
  });
});
