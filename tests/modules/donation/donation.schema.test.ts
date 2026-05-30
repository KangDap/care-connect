import { ApiError } from '@/lib/error';
import { DonationSchema } from '@/modules/donation/donation.schema';
import { describe, expect, it } from 'vitest';

const makeDonationFormData = (overrides: Record<string, string> = {}) => {
  const formData = new FormData();

  formData.set('reportId', '10');
  formData.set('amount', '50000');
  formData.set('paymentMethod', 'QRIS');
  formData.set('donationType', 'REPORT');

  Object.entries(overrides).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
};

describe('DonationSchema.validateCreateDonation', () => {
  it('validates report donation and coerces numeric fields', () => {
    const result = DonationSchema.validateCreateDonation(
      makeDonationFormData(),
    );

    expect(result).toEqual({
      reportId: 10,
      amount: 50000,
      paymentMethod: 'QRIS',
      donationType: 'REPORT',
    });
  });

  it('uses function donationType fallback when formData does not contain donationType', () => {
    const formData = makeDonationFormData();
    formData.delete('donationType');

    const result = DonationSchema.validateCreateDonation(formData, 'REPORT');

    expect(result.donationType).toBe('REPORT');
  });

  it('accepts platform donation without reportId', () => {
    const formData = makeDonationFormData({
      donationType: 'PLATFORM',
    });

    formData.delete('reportId');

    const result = DonationSchema.validateCreateDonation(formData, 'PLATFORM');

    expect(result.donationType).toBe('PLATFORM');
    expect(result.reportId).toBeNull();
  });

  it.each(['BANK_TRANSFER', 'CREDIT_CARD', 'EWALLET', 'QRIS'])(
    'accepts %s payment method',
    (paymentMethod) => {
      const result = DonationSchema.validateCreateDonation(
        makeDonationFormData({
          paymentMethod,
        }),
      );

      expect(result.paymentMethod).toBe(paymentMethod);
    },
  );

  it('rejects report donation without reportId', () => {
    const formData = makeDonationFormData();
    formData.delete('reportId');

    expect(() => DonationSchema.validateCreateDonation(formData)).toThrow(
      /reportId is required when donationType is REPORT/,
    );
  });

  it.each(['0', '-1000', 'abc'])(
    'rejects non-positive or invalid amount %s',
    (amount) => {
      expect(() =>
        DonationSchema.validateCreateDonation(
          makeDonationFormData({
            amount,
          }),
        ),
      ).toThrow(ApiError);
    },
  );

  it('rejects amount above maximum limit', () => {
    expect(() =>
      DonationSchema.validateCreateDonation(
        makeDonationFormData({
          amount: '1000000001',
        }),
      ),
    ).toThrow(/amount is too large/);
  });

  it('rejects unsupported payment method', () => {
    expect(() =>
      DonationSchema.validateCreateDonation(
        makeDonationFormData({
          paymentMethod: 'CASH',
        }),
      ),
    ).toThrow(/Invalid paymentMethod/);
  });

  it('rejects unsupported donationType', () => {
    expect(() =>
      DonationSchema.validateCreateDonation(
        makeDonationFormData({
          donationType: 'UNKNOWN',
        }),
      ),
    ).toThrow(/Invalid donationType/);
  });
});

describe('DonationSchema.validateMidtransWebhook', () => {
  const validPayload = {
    order_id: 'DONATION-1-1710000000000',
    status_code: '200',
    gross_amount: '50000.00',
    signature_key: 'valid-signature',
    transaction_status: 'settlement',
    payment_type: 'qris',
    fraud_status: 'accept',
  };

  it('validates full Midtrans webhook payload', () => {
    const result = DonationSchema.validateMidtransWebhook(validPayload);

    expect(result).toEqual(validPayload);
  });

  it('allows optional payment_type and fraud_status', () => {
    const {
      payment_type: _paymentType,
      fraud_status: _fraudStatus,
      ...payload
    } = validPayload;

    const result = DonationSchema.validateMidtransWebhook(payload);

    expect(result.order_id).toBe(validPayload.order_id);
    expect(result.status_code).toBe(validPayload.status_code);
    expect(result.gross_amount).toBe(validPayload.gross_amount);
    expect(result.signature_key).toBe(validPayload.signature_key);
    expect(result.transaction_status).toBe(validPayload.transaction_status);
    expect(result.payment_type).toBeUndefined();
    expect(result.fraud_status).toBeUndefined();
  });

  it.each(['order_id', 'signature_key', 'transaction_status'])(
    'rejects webhook payload without required field %s',
    (field) => {
      const payload = {
        ...validPayload,
      } as Record<string, unknown>;

      delete payload[field];

      expect(() => DonationSchema.validateMidtransWebhook(payload)).toThrow(
        /Invalid webhook payload/,
      );
    },
  );

  it.each(['status_code', 'gross_amount'])(
    'allows missing %s based on current z.coerce.string schema behavior',
    (field) => {
      const payload = {
        ...validPayload,
      } as Record<string, unknown>;

      delete payload[field];

      const result = DonationSchema.validateMidtransWebhook(payload);

      expect(result.order_id).toBe(validPayload.order_id);
      expect(result.signature_key).toBe(validPayload.signature_key);
      expect(result.transaction_status).toBe(validPayload.transaction_status);
    },
  );

  it.each([
    'order_id',
    'status_code',
    'gross_amount',
    'signature_key',
    'transaction_status',
  ])('rejects webhook payload with empty required field %s', (field) => {
    const payload = {
      ...validPayload,
      [field]: '',
    };

    expect(() => DonationSchema.validateMidtransWebhook(payload)).toThrow(
      /Invalid webhook payload/,
    );
  });

  it.each(['pending', 'cancel', 'expire', 'deny', 'capture', 'settlement'])(
    'accepts webhook payload with %s transaction status',
    (transactionStatus) => {
      const payload = {
        ...validPayload,
        transaction_status: transactionStatus,
      };

      const result = DonationSchema.validateMidtransWebhook(payload);

      expect(result.transaction_status).toBe(transactionStatus);
    },
  );

  it('keeps gross_amount as string for Midtrans signature verification', () => {
    const result = DonationSchema.validateMidtransWebhook(validPayload);

    expect(result.gross_amount).toBe('50000.00');
    expect(typeof result.gross_amount).toBe('string');
  });

  it('keeps status_code as string for Midtrans signature verification', () => {
    const result = DonationSchema.validateMidtransWebhook(validPayload);

    expect(result.status_code).toBe('200');
    expect(typeof result.status_code).toBe('string');
  });
});
