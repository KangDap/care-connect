import { Errors } from '@/lib/error';
import { z } from 'zod';

import type {
  CreateDonationInput,
  MidtransWebhookInput,
} from './donation.types';

const CREATE_DONATION_SCHEMA = z.object({
  reportId: z.coerce
    .number()
    .int()
    .positive('reportId must be a positive integer'),
  amount: z.coerce
    .number()
    .positive('amount must be a positive number')
    .max(1_000_000_000, 'amount is too large'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CREDIT_CARD', 'EWALLET', 'QRIS'], {
    message: 'Invalid paymentMethod',
  }),
});

const MIDTRANS_WEBHOOK_SCHEMA = z.object({
  order_id: z.string().min(1, 'order_id is required'),
  status_code: z.coerce.string().min(1, 'status_code is required'),
  gross_amount: z.coerce.string().min(1, 'gross_amount is required'),
  signature_key: z.string().min(1, 'signature_key is required'),
  transaction_status: z.string().min(1, 'transaction_status is required'),
  payment_type: z.string().optional(),
  fraud_status: z.string().optional(),
});

export class DonationSchema {
  static validateCreateDonation(formData: FormData): CreateDonationInput {
    const parseResult = CREATE_DONATION_SCHEMA.safeParse({
      reportId: formData.get('reportId'),
      amount: formData.get('amount'),
      paymentMethod: formData.get('paymentMethod'),
    });

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((issue) => issue.message)
        .join(', ');
      throw Errors.badRequest(`Invalid donation data: ${errorMessage}`);
    }

    return parseResult.data;
  }

  static validateMidtransWebhook(payload: unknown): MidtransWebhookInput {
    const parseResult = MIDTRANS_WEBHOOK_SCHEMA.safeParse(payload);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((issue) => issue.message)
        .join(', ');
      throw Errors.badRequest(`Invalid webhook payload: ${errorMessage}`);
    }

    return parseResult.data;
  }
}
