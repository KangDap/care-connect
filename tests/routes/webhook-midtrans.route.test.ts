import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  validateMidtransWebhook: vi.fn(),
  handleMidtransWebhook: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  },
}));

vi.mock('@/modules/donation/donation.service', () => ({
  DonationService: {
    validateMidtransWebhook: mocks.validateMidtransWebhook,
    handleMidtransWebhook: mocks.handleMidtransWebhook,
  },
}));

describe('API Route /api/webhook/midtrans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST processes Midtrans webhook successfully', async () => {
    const { POST } = await import('@/app/api/webhook/midtrans/route');

    const payload = {
      order_id: 'DONATION-1-1710000000000',
      status_code: '200',
      gross_amount: '50000.00',
      signature_key: 'valid-signature',
      transaction_status: 'settlement',
    };

    mocks.validateMidtransWebhook.mockReturnValue(payload);
    mocks.handleMidtransWebhook.mockResolvedValue({
      donationId: 1,
      paymentStatus: 'PAID',
    });

    const req = new Request('http://localhost:3000/api/webhook/midtrans', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        message: 'Webhook processed successfully',
        donationId: 1,
        paymentStatus: 'PAID',
      },
    });

    expect(mocks.validateMidtransWebhook).toHaveBeenCalledWith(payload);
    expect(mocks.handleMidtransWebhook).toHaveBeenCalledWith(payload);
  });

  it('POST returns ApiError response when webhook validation fails', async () => {
    const { POST } = await import('@/app/api/webhook/midtrans/route');
    const { Errors } = await import('@/lib/error');

    mocks.validateMidtransWebhook.mockImplementation(() => {
      throw Errors.badRequest('Invalid webhook payload');
    });

    const req = new Request('http://localhost:3000/api/webhook/midtrans', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid webhook payload',
      },
    });

    expect(mocks.handleMidtransWebhook).not.toHaveBeenCalled();
  });

  it('POST returns ApiError response when webhook handler fails', async () => {
    const { POST } = await import('@/app/api/webhook/midtrans/route');
    const { ApiError } = await import('@/lib/error');

    const payload = {
      order_id: 'DONATION-1-1710000000000',
      status_code: '200',
      gross_amount: '50000.00',
      signature_key: 'valid-signature',
      transaction_status: 'settlement',
    };

    mocks.validateMidtransWebhook.mockReturnValue(payload);
    mocks.handleMidtransWebhook.mockRejectedValue(
      new ApiError(403, 'FORBIDDEN', 'Invalid Midtrans signature'),
    );

    const req = new Request('http://localhost:3000/api/webhook/midtrans', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid Midtrans signature',
      },
    });
  });

  it('POST returns 500 when unexpected error happens', async () => {
    const { POST } = await import('@/app/api/webhook/midtrans/route');

    mocks.validateMidtransWebhook.mockImplementation(() => {
      throw new Error('unexpected error');
    });

    const req = new Request('http://localhost:3000/api/webhook/midtrans', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  });
});
