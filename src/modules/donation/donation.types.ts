import type {
  PaymentMethod as PrismaPaymentMethod,
  PaymentStatus as PrismaPaymentStatus,
} from '@/generated/prisma/enums';

export type DonationPaymentMethod = PrismaPaymentMethod;

export type DonationPaymentStatus = PrismaPaymentStatus;

export type CreateDonationInput = {
  reportId: number;
  amount: number;
  paymentMethod: DonationPaymentMethod;
};

export type MidtransWebhookInput = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  payment_type?: string;
  fraud_status?: string;
};

export type CreateDonationRepositoryInput = {
  userId: string;
  reportId: number;
  amount: number;
  paymentMethod: DonationPaymentMethod;
  paymentStatus: DonationPaymentStatus;
};

export type DonationUserContext = {
  id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
};

export type CreateDonationResult = {
  donation: {
    id: number;
    reportId: number;
    amount: unknown;
    paymentMethod: string;
    paymentStatus: string;
    timestamp: Date;
  };
  payment: {
    orderId: string;
    token: string;
    redirectUrl: string;
  };
};

export type HandleWebhookResult = {
  donationId: number;
  paymentStatus: DonationPaymentStatus;
  transactionStatus: string;
};

export type SyncDonationStatusResult = HandleWebhookResult;
