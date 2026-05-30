import type {
  DonationType as PrismaDonationType,
  PaymentMethod as PrismaPaymentMethod,
  PaymentStatus as PrismaPaymentStatus,
} from '@/generated/prisma/enums';

export type DonationPaymentMethod = PrismaPaymentMethod;

export type DonationPaymentStatus = PrismaPaymentStatus;

export type DonationType = PrismaDonationType;

export type CreateDonationInput = {
  reportId?: number | null;
  amount: number;
  paymentMethod: DonationPaymentMethod;
  donationType: DonationType;
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
  reportId?: number | null;
  amount: number;
  paymentMethod: DonationPaymentMethod;
  paymentStatus: DonationPaymentStatus;
  donationType: DonationType;
};

export type UpdateDonationMidtransInput = {
  midtransOrderId: string;
  snapToken: string;
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
    reportId: number | null;
    amount: unknown;
    paymentMethod: string;
    paymentStatus: string;
    donationType: string;
    midtransOrderId?: string | null;
    snapToken?: string | null;
    timestamp: Date;
  };
  payment: {
    orderId: string;
    token: string;
    redirectUrl?: string;
    clientKey?: string;
  };
};

export type HandleWebhookResult = {
  donationId: number;
  paymentStatus: DonationPaymentStatus;
  transactionStatus: string;
};

export type SyncDonationStatusResult = HandleWebhookResult;
