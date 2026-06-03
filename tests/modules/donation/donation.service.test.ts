import { PaymentStatus } from '@/generated/prisma/enums';
import { ApiError } from '@/lib/error';
import {
  createMidtransSnapTransaction,
  getMidtransClientKey,
  getMidtransConfig,
  getMidtransTransactionStatus,
  verifyMidtransSignature,
} from '@/lib/midtrans';
import {
  createDonation,
  findDonationById,
  findReportById,
  getDonationsByUserId,
  updateDonationMidtransData,
  updateDonationStatus,
} from '@/modules/donation/donation.repositories';
import { DonationService } from '@/modules/donation/donation.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/donation/donation.repositories', () => ({
  createDonation: vi.fn(),
  findDonationById: vi.fn(),
  findReportById: vi.fn(),
  getDonationsByUserId: vi.fn(),
  updateDonationMidtransData: vi.fn(),
  updateDonationStatus: vi.fn(),
}));

vi.mock('@/lib/midtrans', () => ({
  createMidtransSnapTransaction: vi.fn(),
  getMidtransClientKey: vi.fn(),
  getMidtransConfig: vi.fn(),
  getMidtransTransactionStatus: vi.fn(),
  verifyMidtransSignature: vi.fn(),
}));

const mockCreateDonation = vi.mocked(createDonation);
const mockFindDonationById = vi.mocked(findDonationById);
const mockFindReportById = vi.mocked(findReportById);
const mockGetDonationsByUserId = vi.mocked(getDonationsByUserId);
const mockUpdateDonationMidtransData = vi.mocked(updateDonationMidtransData);
const mockUpdateDonationStatus = vi.mocked(updateDonationStatus);

const mockCreateMidtransSnapTransaction = vi.mocked(
  createMidtransSnapTransaction,
);
const mockGetMidtransClientKey = vi.mocked(getMidtransClientKey);
const mockGetMidtransConfig = vi.mocked(getMidtransConfig);
const mockGetMidtransTransactionStatus = vi.mocked(
  getMidtransTransactionStatus,
);
const mockVerifyMidtransSignature = vi.mocked(verifyMidtransSignature);

const user = {
  id: 'user-1',
  name: 'Niki',
  email: 'niki@mail.com',
  phoneNumber: '08123456789',
};

const baseDonation = {
  id: 1,
  userId: 'user-1',
  reportId: 10,
  amount: 50000,
  paymentMethod: 'QRIS',
  paymentStatus: PaymentStatus.PENDING,
  donationType: 'REPORT',
  midtransOrderId: null,
  snapToken: null,
  timestamp: new Date('2026-05-25T00:00:00.000Z'),
};

const baseWebhookPayload = {
  order_id: 'DONATION-1-1710000000000',
  status_code: '200',
  gross_amount: '50000.00',
  signature_key: 'valid-signature',
  transaction_status: 'settlement',
  payment_type: 'qris',
  fraud_status: 'accept',
};

describe('DonationService.validateCreateDonation', () => {
  it('validates report donation form data', () => {
    const formData = new FormData();

    formData.set('reportId', '10');
    formData.set('amount', '50000');
    formData.set('paymentMethod', 'QRIS');
    formData.set('donationType', 'REPORT');

    const result = DonationService.validateCreateDonation(formData, 'REPORT');

    expect(result).toEqual({
      reportId: 10,
      amount: 50000,
      paymentMethod: 'QRIS',
      donationType: 'REPORT',
    });
  });

  it('validates platform donation form data without reportId', () => {
    const formData = new FormData();

    formData.set('amount', '75000');
    formData.set('paymentMethod', 'EWALLET');
    formData.set('donationType', 'PLATFORM');

    const result = DonationService.validateCreateDonation(formData, 'PLATFORM');

    expect(result).toEqual({
      reportId: null,
      amount: 75000,
      paymentMethod: 'EWALLET',
      donationType: 'PLATFORM',
    });
  });

  it('throws ApiError when donation input is invalid', () => {
    const formData = new FormData();

    formData.set('amount', '-1000');
    formData.set('paymentMethod', 'QRIS');
    formData.set('donationType', 'REPORT');

    expect(() =>
      DonationService.validateCreateDonation(formData, 'REPORT'),
    ).toThrow(ApiError);
  });
});

describe('DonationService.getDonationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns donation history by user id', async () => {
    const donations = [baseDonation];

    mockGetDonationsByUserId.mockResolvedValue(donations);

    const result = await DonationService.getDonationHistory('user-1');

    expect(result).toEqual(donations);
    expect(mockGetDonationsByUserId).toHaveBeenCalledWith('user-1');
  });

  it('propagates repository error when getting donation history fails', async () => {
    mockGetDonationsByUserId.mockRejectedValue(new Error('database down'));

    await expect(DonationService.getDonationHistory('user-1')).rejects.toThrow(
      'database down',
    );
  });
});

describe('DonationService.validateMidtransWebhook', () => {
  it('validates Midtrans webhook payload', () => {
    const result = DonationService.validateMidtransWebhook(baseWebhookPayload);

    expect(result).toEqual(baseWebhookPayload);
  });

  it('throws ApiError when Midtrans webhook payload is invalid', () => {
    expect(() => DonationService.validateMidtransWebhook({})).toThrow(ApiError);
  });
});

describe('DonationService.createDonation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1710000000000);

    mockGetMidtransConfig.mockReturnValue({
      serverKey: 'server-key',
      clientKey: 'client-key',
      isProduction: false,
    });

    mockGetMidtransClientKey.mockReturnValue('client-key');

    mockCreateMidtransSnapTransaction.mockResolvedValue({
      token: 'snap-token',
      redirect_url: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token',
    });

    mockUpdateDonationMidtransData.mockResolvedValue({
      id: 1,
      midtransOrderId: 'DONATION-1-1710000000000',
      snapToken: 'snap-token',
      paymentStatus: PaymentStatus.PENDING,
    });
  });

  it('creates report donation successfully', async () => {
    mockFindReportById.mockResolvedValue({
      id: 10,
      title: 'Laporan Kekerasan Verbal',
    });

    mockCreateDonation.mockResolvedValue(baseDonation);

    const result = await DonationService.createDonation(
      user,
      {
        reportId: 10,
        amount: 50000,
        paymentMethod: 'QRIS',
        donationType: 'REPORT',
      },
      {
        finishUrl: 'http://localhost:3000/dashboard/donations',
      },
    );

    expect(mockGetMidtransConfig).toHaveBeenCalledTimes(1);
    expect(mockFindReportById).toHaveBeenCalledWith(10);

    expect(mockCreateDonation).toHaveBeenCalledWith({
      userId: 'user-1',
      reportId: 10,
      amount: 50000,
      paymentMethod: 'QRIS',
      paymentStatus: PaymentStatus.PENDING,
      donationType: 'REPORT',
    });

    expect(mockCreateMidtransSnapTransaction).toHaveBeenCalledWith({
      orderId: 'DONATION-1-1710000000000',
      grossAmount: 50000,
      paymentMethod: 'QRIS',
      finishUrl: 'http://localhost:3000/dashboard/donations',
      report: {
        id: 10,
        title: 'Laporan Kekerasan Verbal',
      },
      customer: {
        name: 'Niki',
        email: 'niki@mail.com',
        phone: '08123456789',
      },
    });

    expect(mockUpdateDonationMidtransData).toHaveBeenCalledWith(1, {
      midtransOrderId: 'DONATION-1-1710000000000',
      snapToken: 'snap-token',
    });

    expect(result).toEqual({
      donation: baseDonation,
      payment: {
        orderId: 'DONATION-1-1710000000000',
        token: 'snap-token',
        clientKey: 'client-key',
      },
    });
  });

  it('creates platform donation successfully without report lookup', async () => {
    const platformDonation = {
      ...baseDonation,
      id: 2,
      reportId: null,
      amount: 75000,
      paymentMethod: 'EWALLET',
      donationType: 'PLATFORM',
    };

    mockCreateDonation.mockResolvedValue(platformDonation);

    const result = await DonationService.createDonation(
      user,
      {
        reportId: null,
        amount: 75000,
        paymentMethod: 'EWALLET',
        donationType: 'PLATFORM',
      },
      {
        finishUrl: 'http://localhost:3000/dashboard/donations',
      },
    );

    expect(mockFindReportById).not.toHaveBeenCalled();

    expect(mockCreateDonation).toHaveBeenCalledWith({
      userId: 'user-1',
      reportId: null,
      amount: 75000,
      paymentMethod: 'EWALLET',
      paymentStatus: PaymentStatus.PENDING,
      donationType: 'PLATFORM',
    });

    expect(mockCreateMidtransSnapTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'DONATION-2-1710000000000',
        grossAmount: 75000,
        paymentMethod: 'EWALLET',
        report: undefined,
      }),
    );

    expect(result.payment).toEqual({
      orderId: 'DONATION-2-1710000000000',
      token: 'snap-token',
      clientKey: 'client-key',
    });
  });

  it('throws bad request when report donation does not include reportId', async () => {
    await expect(
      DonationService.createDonation(user, {
        reportId: null,
        amount: 50000,
        paymentMethod: 'QRIS',
        donationType: 'REPORT',
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
    });

    expect(mockCreateDonation).not.toHaveBeenCalled();
  });

  it('throws not found when report does not exist', async () => {
    mockFindReportById.mockResolvedValue(null);

    await expect(
      DonationService.createDonation(user, {
        reportId: 999,
        amount: 50000,
        paymentMethod: 'QRIS',
        donationType: 'REPORT',
      }),
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });

    expect(mockCreateDonation).not.toHaveBeenCalled();
  });

  it('throws internal error when getMidtransConfig fails unexpectedly', async () => {
    mockGetMidtransConfig.mockImplementation(() => {
      throw new Error('missing config');
    });

    await expect(
      DonationService.createDonation(user, {
        reportId: null,
        amount: 50000,
        paymentMethod: 'QRIS',
        donationType: 'PLATFORM',
      }),
    ).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
    });
  });

  it('marks donation as FAILED when Midtrans transaction creation fails', async () => {
    mockFindReportById.mockResolvedValue({
      id: 10,
      title: 'Laporan Kekerasan Verbal',
    });

    mockCreateDonation.mockResolvedValue(baseDonation);

    mockCreateMidtransSnapTransaction.mockRejectedValue(
      new Error('midtrans down'),
    );

    await expect(
      DonationService.createDonation(user, {
        reportId: 10,
        amount: 50000,
        paymentMethod: 'QRIS',
        donationType: 'REPORT',
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });

    expect(mockUpdateDonationStatus).toHaveBeenCalledWith(
      1,
      PaymentStatus.FAILED,
    );
  });

  it('does not fail create donation when update Midtrans data fails', async () => {
    mockFindReportById.mockResolvedValue({
      id: 10,
      title: 'Laporan Kekerasan Verbal',
    });

    mockCreateDonation.mockResolvedValue(baseDonation);

    mockUpdateDonationMidtransData.mockRejectedValue(
      new Error('update failed'),
    );

    const result = await DonationService.createDonation(user, {
      reportId: 10,
      amount: 50000,
      paymentMethod: 'QRIS',
      donationType: 'REPORT',
    });

    expect(result.payment).toEqual({
      orderId: 'DONATION-1-1710000000000',
      token: 'snap-token',
      clientKey: 'client-key',
    });
  });

  it('throws internal error when repository create donation fails unexpectedly', async () => {
    mockFindReportById.mockResolvedValue({
      id: 10,
      title: 'Laporan Kekerasan Verbal',
    });

    mockCreateDonation.mockRejectedValue(new Error('database down'));

    await expect(
      DonationService.createDonation(user, {
        reportId: 10,
        amount: 50000,
        paymentMethod: 'QRIS',
        donationType: 'REPORT',
      }),
    ).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('DonationService.handleMidtransWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates donation status to PAID for settlement transaction', async () => {
    mockVerifyMidtransSignature.mockReturnValue(true);

    mockFindDonationById.mockResolvedValue({
      ...baseDonation,
      id: 1,
      paymentStatus: PaymentStatus.PENDING,
    });

    mockUpdateDonationStatus.mockResolvedValue({
      id: 1,
      paymentStatus: PaymentStatus.PAID,
    });

    const result =
      await DonationService.handleMidtransWebhook(baseWebhookPayload);

    expect(mockVerifyMidtransSignature).toHaveBeenCalledWith(
      baseWebhookPayload,
    );
    expect(mockFindDonationById).toHaveBeenCalledWith(1);
    expect(mockUpdateDonationStatus).toHaveBeenCalledWith(
      1,
      PaymentStatus.PAID,
    );

    expect(result).toEqual({
      donationId: 1,
      paymentStatus: PaymentStatus.PAID,
      transactionStatus: 'settlement',
    });
  });

  it('does not update donation status when status is already the same', async () => {
    mockVerifyMidtransSignature.mockReturnValue(true);

    mockFindDonationById.mockResolvedValue({
      ...baseDonation,
      paymentStatus: PaymentStatus.PAID,
    });

    const result =
      await DonationService.handleMidtransWebhook(baseWebhookPayload);

    expect(mockUpdateDonationStatus).not.toHaveBeenCalled();

    expect(result).toEqual({
      donationId: 1,
      paymentStatus: PaymentStatus.PAID,
      transactionStatus: 'settlement',
    });
  });

  it.each([
    ['pending', undefined, PaymentStatus.PENDING],
    ['capture', 'accept', PaymentStatus.PAID],
    ['capture', 'challenge', PaymentStatus.PENDING],
    ['deny', undefined, PaymentStatus.FAILED],
    ['cancel', undefined, PaymentStatus.CANCELLED],
    ['expire', undefined, PaymentStatus.EXPIRED],
    ['refund', undefined, PaymentStatus.REFUNDED],
    ['partial_refund', undefined, PaymentStatus.REFUNDED],
    ['failure', undefined, PaymentStatus.FAILED],
    ['unknown_status', undefined, PaymentStatus.PENDING],
  ])(
    'maps Midtrans transaction_status %s with fraud_status %s to %s',
    async (transactionStatus, fraudStatus, expectedStatus) => {
      mockVerifyMidtransSignature.mockReturnValue(true);

      mockFindDonationById.mockResolvedValue({
        ...baseDonation,
        paymentStatus: PaymentStatus.PENDING,
      });

      mockUpdateDonationStatus.mockResolvedValue({
        id: 1,
        paymentStatus: expectedStatus,
      });

      const result = await DonationService.handleMidtransWebhook({
        ...baseWebhookPayload,
        transaction_status: transactionStatus,
        fraud_status: fraudStatus,
      });

      if (expectedStatus === PaymentStatus.PENDING) {
        expect(result.paymentStatus).toBe(PaymentStatus.PENDING);
      } else {
        expect(mockUpdateDonationStatus).toHaveBeenCalledWith(
          1,
          expectedStatus,
        );
        expect(result.paymentStatus).toBe(expectedStatus);
      }
    },
  );

  it('throws unauthorized error when Midtrans signature is invalid', async () => {
    mockVerifyMidtransSignature.mockReturnValue(false);

    await expect(
      DonationService.handleMidtransWebhook(baseWebhookPayload),
    ).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });

    expect(mockFindDonationById).not.toHaveBeenCalled();
    expect(mockUpdateDonationStatus).not.toHaveBeenCalled();
  });

  it('throws bad request when order id format is invalid', async () => {
    mockVerifyMidtransSignature.mockReturnValue(true);

    await expect(
      DonationService.handleMidtransWebhook({
        ...baseWebhookPayload,
        order_id: 'INVALID-ORDER-ID',
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
    });

    expect(mockFindDonationById).not.toHaveBeenCalled();
  });

  it('throws not found when donation does not exist', async () => {
    mockVerifyMidtransSignature.mockReturnValue(true);
    mockFindDonationById.mockResolvedValue(null);

    await expect(
      DonationService.handleMidtransWebhook(baseWebhookPayload),
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('throws internal error when repository update fails unexpectedly', async () => {
    mockVerifyMidtransSignature.mockReturnValue(true);

    mockFindDonationById.mockResolvedValue({
      ...baseDonation,
      paymentStatus: PaymentStatus.PENDING,
    });

    mockUpdateDonationStatus.mockRejectedValue(new Error('database down'));

    await expect(
      DonationService.handleMidtransWebhook(baseWebhookPayload),
    ).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('DonationService.syncDonationStatusByOrderId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('syncs donation status from Midtrans transaction status', async () => {
    mockFindDonationById.mockResolvedValue({
      ...baseDonation,
      id: 1,
      userId: 'user-1',
      paymentStatus: PaymentStatus.PENDING,
    });

    mockGetMidtransTransactionStatus.mockResolvedValue({
      transaction_status: 'settlement',
      fraud_status: 'accept',
    });

    mockUpdateDonationStatus.mockResolvedValue({
      id: 1,
      paymentStatus: PaymentStatus.PAID,
    });

    const result = await DonationService.syncDonationStatusByOrderId(
      'DONATION-1-1710000000000',
      'user-1',
    );

    expect(mockFindDonationById).toHaveBeenCalledWith(1);
    expect(mockGetMidtransTransactionStatus).toHaveBeenCalledWith(
      'DONATION-1-1710000000000',
    );
    expect(mockUpdateDonationStatus).toHaveBeenCalledWith(
      1,
      PaymentStatus.PAID,
    );

    expect(result).toEqual({
      donationId: 1,
      paymentStatus: PaymentStatus.PAID,
      transactionStatus: 'settlement',
    });
  });

  it('does not update status when synced status is same as current status', async () => {
    mockFindDonationById.mockResolvedValue({
      ...baseDonation,
      id: 1,
      userId: 'user-1',
      paymentStatus: PaymentStatus.PAID,
    });

    mockGetMidtransTransactionStatus.mockResolvedValue({
      transaction_status: 'settlement',
      fraud_status: 'accept',
    });

    const result = await DonationService.syncDonationStatusByOrderId(
      'DONATION-1-1710000000000',
      'user-1',
    );

    expect(mockUpdateDonationStatus).not.toHaveBeenCalled();

    expect(result).toEqual({
      donationId: 1,
      paymentStatus: PaymentStatus.PAID,
      transactionStatus: 'settlement',
    });
  });

  it('throws not found when donation does not belong to user', async () => {
    mockFindDonationById.mockResolvedValue({
      ...baseDonation,
      id: 1,
      userId: 'other-user',
    });

    await expect(
      DonationService.syncDonationStatusByOrderId(
        'DONATION-1-1710000000000',
        'user-1',
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('throws not found when donation does not exist', async () => {
    mockFindDonationById.mockResolvedValue(null);

    await expect(
      DonationService.syncDonationStatusByOrderId(
        'DONATION-1-1710000000000',
        'user-1',
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('throws bad request when order id format is invalid', async () => {
    await expect(
      DonationService.syncDonationStatusByOrderId('INVALID-ORDER-ID', 'user-1'),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
    });
  });

  it('throws internal error when Midtrans status check fails unexpectedly', async () => {
    mockFindDonationById.mockResolvedValue({
      ...baseDonation,
      id: 1,
      userId: 'user-1',
      paymentStatus: PaymentStatus.PENDING,
    });

    mockGetMidtransTransactionStatus.mockRejectedValue(
      new Error('midtrans down'),
    );

    await expect(
      DonationService.syncDonationStatusByOrderId(
        'DONATION-1-1710000000000',
        'user-1',
      ),
    ).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});
