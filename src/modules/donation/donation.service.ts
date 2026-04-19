import { PaymentStatus } from '@/generated/prisma/enums';
import { ApiError, Errors } from '@/lib/error';
import {
  createMidtransSnapTransaction,
  getMidtransConfig,
  verifyMidtransSignature,
} from '@/lib/midtrans';

import {
  createDonation,
  findDonationById,
  findReportById,
  getDonationsByUserId,
  updateDonationStatus,
} from './donation.repositories';
import { DonationSchema } from './donation.schema';
import type {
  CreateDonationInput,
  CreateDonationResult,
  DonationPaymentStatus,
  DonationUserContext,
  HandleWebhookResult,
  MidtransWebhookInput,
} from './donation.types';

const mapMidtransStatusToDonationStatus = (
  transactionStatus: string,
  fraudStatus?: string,
): DonationPaymentStatus => {
  switch (transactionStatus) {
    case 'pending':
      return PaymentStatus.PENDING;
    case 'settlement':
      return PaymentStatus.SUCCESS;
    case 'capture':
      return fraudStatus === 'challenge'
        ? PaymentStatus.PENDING
        : PaymentStatus.SUCCESS;
    case 'deny':
      return PaymentStatus.FAILED;
    case 'cancel':
      return PaymentStatus.FAILED;
    case 'expire':
      return PaymentStatus.FAILED;
    case 'refund':
    case 'partial_refund':
      return PaymentStatus.REFUNDED;
    case 'failure':
      return PaymentStatus.FAILED;
    default:
      return PaymentStatus.PENDING;
  }
};

const parseDonationIdFromOrderId = (orderId: string): number => {
  const match = /^DONATION-(\d+)-\d+$/i.exec(orderId);

  if (!match) {
    throw Errors.badRequest('Invalid order_id format');
  }

  return Number(match[1]);
};

export class DonationService {
  static validateCreateDonation(formData: FormData): CreateDonationInput {
    return DonationSchema.validateCreateDonation(formData);
  }

  static async getDonationHistory(userId: string) {
    return getDonationsByUserId(userId);
  }

  static validateMidtransWebhook(payload: unknown): MidtransWebhookInput {
    return DonationSchema.validateMidtransWebhook(payload);
  }

  static async handleMidtransWebhook(
    payload: MidtransWebhookInput,
  ): Promise<HandleWebhookResult> {
    try {
      const isValidSignature = verifyMidtransSignature(payload);
      if (!isValidSignature) {
        throw Errors.unauthorized('Invalid Midtrans signature');
      }

      const donationId = parseDonationIdFromOrderId(payload.order_id);
      const donation = await findDonationById(donationId);

      if (!donation) {
        throw Errors.notFound('Donation not found for provided order_id');
      }

      const mappedStatus = mapMidtransStatusToDonationStatus(
        payload.transaction_status,
        payload.fraud_status,
      );

      if (donation.paymentStatus !== mappedStatus) {
        await updateDonationStatus(donation.id, mappedStatus);
      }

      return {
        donationId: donation.id,
        paymentStatus: mappedStatus,
        transactionStatus: payload.transaction_status,
      };
    } catch (error) {
      console.error('DONATION WEBHOOK SERVICE ERROR:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw Errors.internal('Failed to process Midtrans webhook');
    }
  }

  static async createDonation(
    user: DonationUserContext,
    input: CreateDonationInput,
  ): Promise<CreateDonationResult> {
    try {
      getMidtransConfig();

      const report = await findReportById(input.reportId);
      if (!report) {
        throw Errors.notFound('Report not found');
      }

      const donation = await createDonation({
        userId: user.id,
        reportId: input.reportId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
      });

      const orderId = `DONATION-${donation.id}-${Date.now()}`;

      try {
        const transaction = await createMidtransSnapTransaction({
          orderId,
          grossAmount: input.amount,
          paymentMethod: input.paymentMethod,
          report: {
            id: report.id,
            title: report.title,
          },
          customer: {
            name: user.name,
            email: user.email,
            phone: user.phoneNumber,
          },
        });

        return {
          donation,
          payment: {
            orderId,
            token: transaction.token,
            redirectUrl: transaction.redirect_url,
          },
        };
      } catch (error) {
        await updateDonationStatus(donation.id, PaymentStatus.FAILED);

        if (error instanceof ApiError) {
          throw error;
        }

        throw Errors.unprocessable('Failed to create payment transaction');
      }
    } catch (error) {
      console.error('DONATION CREATE SERVICE ERROR:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw Errors.internal('Failed to process donation');
    }
  }
}
