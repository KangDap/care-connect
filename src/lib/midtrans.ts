import midtransClient from 'midtrans-client';
import crypto from 'node:crypto';

type MidtransPaymentType =
  | 'bank_transfer'
  | 'credit_card'
  | 'gopay'
  | 'other_qris';

type CreateMidtransSnapTransactionInput = {
  orderId: string;
  grossAmount: number;
  paymentMethod: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'EWALLET' | 'QRIS';
  report: {
    id: number;
    title: string;
  };
  customer: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

type MidtransSnapTransactionResponse = {
  token: string;
  redirect_url: string;
};

type MidtransTransactionStatusResponse = {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
};

const globalForMidtrans = globalThis as unknown as {
  midtransSnap: InstanceType<typeof midtransClient.Snap> | undefined;
};

const MIDTRANS_ENV_KEYS = {
  serverKey: 'MIDTRANS_SERVER_KEY',
  clientKey: 'MIDTRANS_CLIENT_KEY',
  isProduction: 'MIDTRANS_IS_PRODUCTION',
} as const;

const parseIsProduction = (value?: string) => value?.toLowerCase() === 'true';

const getAppBaseUrl = () => {
  const rawBaseUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';

  return rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
};

const trimForMidtrans = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(maxLength - 3, 0))}...`;
};

const formatReportDisplayId = (id: number) =>
  `#REP-${String(id).padStart(4, '0')}`;

const mapPaymentMethodToMidtrans = (
  method: CreateMidtransSnapTransactionInput['paymentMethod'],
): MidtransPaymentType[] => {
  const map: Record<
    CreateMidtransSnapTransactionInput['paymentMethod'],
    MidtransPaymentType[]
  > = {
    BANK_TRANSFER: ['bank_transfer'],
    CREDIT_CARD: ['credit_card'],
    EWALLET: ['gopay'],
    QRIS: ['other_qris'],
  };

  const enabledPayments = map[method];

  if (!enabledPayments) {
    throw new Error(`Unsupported payment method: ${method}`);
  }

  return enabledPayments;
};

export const getMidtransConfig = () => {
  const serverKey = process.env[MIDTRANS_ENV_KEYS.serverKey];
  const clientKey = process.env[MIDTRANS_ENV_KEYS.clientKey];
  const isProduction = parseIsProduction(
    process.env[MIDTRANS_ENV_KEYS.isProduction],
  );

  if (!serverKey) {
    throw new Error(`${MIDTRANS_ENV_KEYS.serverKey} is not configured`);
  }

  if (!clientKey) {
    throw new Error(`${MIDTRANS_ENV_KEYS.clientKey} is not configured`);
  }

  return { serverKey, clientKey, isProduction };
};

export const getMidtransSnapClient = () => {
  const { serverKey, isProduction } = getMidtransConfig();

  if (process.env.NODE_ENV === 'production') {
    return new midtransClient.Snap({ isProduction, serverKey });
  }

  if (!globalForMidtrans.midtransSnap) {
    globalForMidtrans.midtransSnap = new midtransClient.Snap({
      isProduction,
      serverKey,
    });
  }

  return globalForMidtrans.midtransSnap;
};

export const getMidtransClientKey = () => {
  const clientKey =
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
    process.env[MIDTRANS_ENV_KEYS.clientKey];

  if (!clientKey) {
    throw new Error(
      'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY or MIDTRANS_CLIENT_KEY is not configured',
    );
  }

  return clientKey;
};

export const createMidtransSnapTransaction = async (
  input: CreateMidtransSnapTransactionInput,
) => {
  const snap = getMidtransSnapClient();
  const appBaseUrl = getAppBaseUrl();
  const enabledPayments = mapPaymentMethodToMidtrans(input.paymentMethod);
  const roundedAmount = Math.round(input.grossAmount);
  const reportDisplayId = formatReportDisplayId(input.report.id);
  const reportItemName = trimForMidtrans(
    `Donation for ${reportDisplayId} - ${input.report.title}`,
    50,
  );

  return (await snap.createTransaction({
    transaction_details: {
      order_id: input.orderId,
      gross_amount: roundedAmount,
    },
    enabled_payments: enabledPayments,
    item_details: [
      {
        id: reportDisplayId.replace('#', ''),
        name: reportItemName,
        quantity: 1,
        price: roundedAmount,
      },
    ],
    customer_details: {
      first_name: input.customer.name || 'CareConnect User',
      email: input.customer.email,
      phone: input.customer.phone,
    },
    custom_field1: `report_id:${reportDisplayId}`,
    custom_field2: trimForMidtrans(input.report.title, 255),
    callbacks: {
      finish: `${appBaseUrl}/dashboard/donations?payment=success&orderId=${encodeURIComponent(input.orderId)}`,
      pending: `${appBaseUrl}/dashboard/donations?payment=pending&orderId=${encodeURIComponent(input.orderId)}`,
      error: `${appBaseUrl}/dashboard/donations?payment=error&orderId=${encodeURIComponent(input.orderId)}`,
    },
  })) as MidtransSnapTransactionResponse;
};

export const verifyMidtransSignature = (payload: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}) => {
  const { serverKey } = getMidtransConfig();
  const expectedSignature = crypto
    .createHash('sha512')
    .update(
      `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`,
    )
    .digest('hex');

  return expectedSignature === payload.signature_key;
};

export const getMidtransTransactionStatus = async (orderId: string) => {
  const snap = getMidtransSnapClient();

  return (await snap.transaction.status(
    orderId,
  )) as MidtransTransactionStatusResponse;
};
